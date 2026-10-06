import 'server-only';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { exigerAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json, type RouteContext } from '@/backend/http';

const modificationSchema = z.object({
  nom: z.string().trim().min(1).max(120),
  telephone: z.string().trim().min(6).max(40).nullable(),
  role: z.enum(['client', 'admin']),
}).partial().strict();

const DERNIER_ADMIN = 'Impossible : c’est le dernier compte administrateur. Donnez d’abord le rôle admin à un autre compte.';

function idUtilisateur(valeur: string) {
  if (!/^[\w-]{1,64}$/.test(valeur)) throw new ApiError(400, 'Identifiant invalide');
  return valeur;
}

/** Refuse de retirer le dernier admin (rétrogradation ou suppression, y compris de soi-même). */
async function verifierQueCeNestPasLeDernierAdmin(tx: Prisma.TransactionClient, id: string) {
  // Verrou d'écriture SQLite d'abord (comme lockSession) : deux admins qui se
  // rétrogradent en même temps ne peuvent pas compter « 2 admins » tous les deux.
  await tx.user.updateMany({ where: { id }, data: { id } });
  const utilisateur = await tx.user.findUnique({ where: { id }, select: { role: true } });
  if (!utilisateur) throw new ApiError(404, 'Utilisateur introuvable');
  if (utilisateur.role === 'admin' && await tx.user.count({ where: { role: 'admin' } }) <= 1) throw new ApiError(409, DERNIER_ADMIN);
}

/** GET /api/utilisateurs (admin) : comptes, sans aucune donnée d'authentification. */
export const listUtilisateurs = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  return json(await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, nom: true, email: true, telephone: true, role: true, createdAt: true, _count: { select: { reservations: true, demandesDevis: true } } },
  }));
});

/** PATCH /api/utilisateurs/[id] (admin) : nom, téléphone ou rôle. */
export const updateUtilisateur = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = idUtilisateur((await context.params).id);
  const data = modificationSchema.parse(await request.json());
  // Transaction : le comptage et la modification ne peuvent pas être entrecoupés.
  return json(await prisma.$transaction(async tx => {
    if (data.role === 'client') await verifierQueCeNestPasLeDernierAdmin(tx, id);
    return tx.user.update({ where: { id }, data, select: { id: true, nom: true, email: true, telephone: true, role: true } });
  }));
});

/** DELETE /api/utilisateurs/[id] (admin) : réservations et devis sont conservés, détachés du compte. */
export const deleteUtilisateur = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = idUtilisateur((await context.params).id);
  await prisma.$transaction(async tx => {
    await verifierQueCeNestPasLeDernierAdmin(tx, id);
    await tx.user.delete({ where: { id } });
  });
  return json({ ok: true });
});
