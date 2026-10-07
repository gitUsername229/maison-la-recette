import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { exigerAdmin } from '@/backend/auth/acces';
import { auth } from '@/backend/auth/auth';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json, type RouteContext } from '@/backend/http';

// Gestion des admins (/admin/utilisateurs) : les visiteurs n'ont pas de compte, seuls les admins se connectent.

/** Page où mène le lien de l'e-mail pour choisir (ou changer) son mot de passe. */
export const PAGE_MOT_DE_PASSE = '/admin/reinitialiser-mot-de-passe';

const ajoutSchema = z.object({
  nom: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
}).strict();

const DERNIER_ADMIN = 'Impossible : c’est le dernier compte administrateur. Ajoutez d’abord un autre admin.';

function idUtilisateur(valeur: string) {
  if (!/^[\w-]{1,64}$/.test(valeur)) throw new ApiError(400, 'Identifiant invalide');
  return valeur;
}

/** Refuse de supprimer le dernier admin (y compris soi-même). */
async function verifierQueCeNestPasLeDernierAdmin(tx: Prisma.TransactionClient, id: string) {
  // Verrou d'écriture SQLite d'abord (comme lockSession) : deux admins qui se
  // suppriment en même temps ne peuvent pas compter « 2 admins » tous les deux.
  await tx.user.updateMany({ where: { id }, data: { id } });
  const utilisateur = await tx.user.findUnique({ where: { id }, select: { role: true } });
  if (!utilisateur) throw new ApiError(404, 'Compte introuvable');
  if (utilisateur.role === 'admin' && await tx.user.count({ where: { role: 'admin' } }) <= 1) throw new ApiError(409, DERNIER_ADMIN);
}

/** GET /api/utilisateurs (admin) : les admins, sans aucune donnée d'authentification. */
export const listUtilisateurs = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, nom: true, email: true, createdAt: true, _count: { select: { comptes: { where: { providerId: 'credential' } } } } },
  });
  // « Mot de passe choisi » : faux tant que l'admin ajouté n'a pas utilisé le lien reçu par e-mail.
  return json(admins.map(({ _count, ...admin }) => ({ ...admin, motDePasseChoisi: _count.comptes > 0 })));
});

/**
 * POST /api/utilisateurs (admin) : ajoute un admin (nom, e-mail), sans mot de passe. Il reçoit par e-mail
 * un lien valable 1 h pour choisir le sien (passé ce délai : « Mot de passe oublié » sur /admin/connexion).
 */
export const ajouterAdmin = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const { nom, email } = ajoutSchema.parse(await request.json());
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new ApiError(409, 'Cette adresse a déjà un accès à l’administration.', { champ: 'email' });
  }
  const admin = await prisma.user.create({
    data: { id: randomUUID(), nom, email, role: 'admin', emailVerified: true },
    select: { id: true, nom: true, email: true },
  });
  await auth.api.requestPasswordReset({ body: { email, redirectTo: PAGE_MOT_DE_PASSE } });
  return json(admin, 201);
});

/** DELETE /api/utilisateurs/[id] (admin) : retire un admin (ses connexions ouvertes sont fermées). */
export const deleteUtilisateur = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = idUtilisateur((await context.params).id);
  await prisma.$transaction(async tx => {
    await verifierQueCeNestPasLeDernierAdmin(tx, id);
    await tx.user.delete({ where: { id } });
  });
  return json({ ok: true });
});
