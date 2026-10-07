import 'server-only';
import { z } from 'zod';
import { prisma } from '@/backend/db/prisma';
import { enArrierePlan } from '@/backend/mails/envoi';
import { envoyerMailsDevis } from '@/backend/mails/notifications';
import { limiterDebit, lirePiege } from '@/backend/anti-spam';
import { exigerAdmin } from '@/backend/auth/acces';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import { devisSchema } from './validation';

/** Réponse identique pour toute demande acceptée : aucun identifiant interne n'est communiqué au visiteur. */
const MERCI_DEVIS = 'Merci ! Julie vous rappelle sous 48 h pour en parler.';

/** POST /api/devis (public, sans compte) : nom, entreprise, e-mail et téléphone saisis dans le formulaire. */
export const createDevis = endpoint(async (request: Request) => {
  limiterDebit(request, 'devis');
  const { robot, donnees } = lirePiege(await request.json());
  // Robot : même réponse qu'une vraie demande, mais rien n'est enregistré ni envoyé.
  if (robot) return json({ message: MERCI_DEVIS }, 201);
  const { nom, consentement: consentementLe, ...data } = devisSchema.parse(donnees);
  if (data.dateSouhaitee && data.dateSouhaitee < new Date()) throw new ApiError(400, 'La date souhaitée doit être future');
  if (data.typeDemande !== 'experience' && data.experienceId) throw new ApiError(400, 'Seule une demande « expérience » peut viser une expérience');
  if (data.experienceId && !await prisma.experience.findFirst({ where: { id: data.experienceId, actif: true } })) throw new ApiError(404, 'Expérience introuvable');
  const devis = await prisma.demandeDevis.create({ data: { ...data, contactNom: nom, consentementLe }, select: { id: true } });
  enArrierePlan(envoyerMailsDevis(devis.id));
  return json({ message: MERCI_DEVIS }, 201);
});

export const listDevis = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const statut = new URL(request.url).searchParams.get('statut');
  if (statut && !['nouvelle', 'en_cours', 'traitee'].includes(statut)) throw new ApiError(400, 'Statut invalide');
  return json(await prisma.demandeDevis.findMany({ where: statut ? { statut } : {}, orderBy: { createdAt: 'desc' }, include: { experience: { select: { titre: true } } } }));
});

const modificationDevisSchema = z.object({
  statut: z.enum(['nouvelle', 'en_cours', 'traitee']),
  // Note interne : visible seulement dans l'admin, jamais par le client.
  noteInterne: z.string().trim().max(5000).nullable(),
}).partial().strict();

/** PATCH /api/devis/[id] (admin) : statut et/ou note interne. */
export const updateDevis = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const data = modificationDevisSchema.parse(await request.json());
  return json(await prisma.demandeDevis.update({ where: { id: positiveId((await context.params).id) }, data }));
});

/** DELETE /api/devis/[id] (admin). */
export const deleteDevis = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  await prisma.demandeDevis.delete({ where: { id: positiveId((await context.params).id) } });
  return json({ ok: true });
});
