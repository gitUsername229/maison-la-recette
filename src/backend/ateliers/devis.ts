import 'server-only';
import { z } from 'zod';
import { prisma } from '@/backend/db/prisma';
import { exigerAdmin } from '@/backend/auth/acces';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import { devisSchema } from './validation';

export const createDevis = endpoint(async (request: Request) => {
  const data = devisSchema.parse(await request.json());
  if (data.dateSouhaitee && data.dateSouhaitee < new Date()) throw new ApiError(400, 'La date souhaitée doit être future');
  if (data.typeDemande === 'podcast_studio' && data.experienceId) throw new ApiError(400, 'Une demande studio ne concerne pas une expérience');
  if (data.experienceId && !await prisma.experience.findFirst({ where: { id: data.experienceId, actif: true } })) throw new ApiError(404, 'Expérience introuvable');
  return json(await prisma.demandeDevis.create({ data, select: { id: true, statut: true } }), 201);
});

export const listDevis = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const statut = new URL(request.url).searchParams.get('statut');
  if (statut && !['nouvelle', 'en_cours', 'traitee'].includes(statut)) throw new ApiError(400, 'Statut invalide');
  return json(await prisma.demandeDevis.findMany({ where: statut ? { statut } : {}, orderBy: { createdAt: 'desc' } }));
});

export const updateDevis = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const data = z.object({ statut: z.enum(['nouvelle', 'en_cours', 'traitee']) }).strict().parse(await request.json());
  return json(await prisma.demandeDevis.update({ where: { id: positiveId((await context.params).id) }, data }));
});
