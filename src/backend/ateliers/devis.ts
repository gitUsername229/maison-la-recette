import 'server-only';
import { z } from 'zod';
import { prisma } from '@/backend/db/prisma';
import { enArrierePlan } from '@/backend/mails/envoi';
import { envoyerMailsDevis } from '@/backend/mails/notifications';
import { exigerAdmin, exigerConnexion } from '@/backend/auth/acces';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import { devisSchema } from './validation';

export const createDevis = endpoint(async (request: Request) => {
  const utilisateur = await exigerConnexion(request);
  const { telephone: telephoneSaisi, ...data } = devisSchema.parse(await request.json());
  if (data.dateSouhaitee && data.dateSouhaitee < new Date()) throw new ApiError(400, 'La date souhaitée doit être future');
  if (data.typeDemande !== 'experience' && data.experienceId) throw new ApiError(400, 'Seule une demande « expérience » peut viser une expérience');
  if (data.experienceId && !await prisma.experience.findFirst({ where: { id: data.experienceId, actif: true } })) throw new ApiError(404, 'Expérience introuvable');
  const telephone = utilisateur.telephone ?? telephoneSaisi;
  if (!telephone) throw new ApiError(400, 'Indiquez un numéro de téléphone : Julie vous rappelle avant de répondre.');
  // Un téléphone saisi ici complète le compte pour les prochaines demandes.
  if (!utilisateur.telephone) await prisma.user.update({ where: { id: utilisateur.id }, data: { telephone } });
  const contact = { contactNom: utilisateur.nom, email: utilisateur.email, telephone, userId: utilisateur.id };
  const devis = await prisma.demandeDevis.create({ data: { ...data, ...contact }, select: { id: true, statut: true } });
  enArrierePlan(envoyerMailsDevis(devis.id));
  return json(devis, 201);
});

export const listDevis = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const statut = new URL(request.url).searchParams.get('statut');
  if (statut && !['nouvelle', 'en_cours', 'traitee'].includes(statut)) throw new ApiError(400, 'Statut invalide');
  return json(await prisma.demandeDevis.findMany({ where: statut ? { statut } : {}, orderBy: { createdAt: 'desc' }, include: { experience: { select: { titre: true } } } }));
});

export const updateDevis = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const data = z.object({ statut: z.enum(['nouvelle', 'en_cours', 'traitee']) }).strict().parse(await request.json());
  return json(await prisma.demandeDevis.update({ where: { id: positiveId((await context.params).id) }, data }));
});
