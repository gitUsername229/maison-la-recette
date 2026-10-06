import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { requireAdmin } from '@/backend/auth/admin';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import { experienceSchema, experienceUpdateSchema, sessionSchema, sessionUpdateSchema } from './validation';
import { lockSession, pendingSeats } from './inventory';

// Utilisées par les routes /api et par les pages serveur du front.
export function experiencesActives(type?: string) {
  return prisma.experience.findMany({ where: { actif: true, ...(type ? { type } : {}) }, orderBy: { id: 'asc' } });
}

export async function experiencePublique(slug: string) {
  const result = await prisma.experience.findUnique({ where: { slug }, include: { sessions: { where: { dateDebut: { gt: new Date() }, statut: { not: 'annulee' } }, orderBy: { dateDebut: 'asc' }, include: { reservations: { where: { statut: 'en_attente' }, select: { nbPersonnes: true } } } } } });
  if (!result?.actif) return null;
  // La galerie d'une expérience = les images de sa page.
  const images = await prisma.image.findMany({ where: { page: `/experiences/${slug}` }, orderBy: { ordre: 'asc' } });
  return { ...result, images, sessions: result.sessions.map(({ reservations, ...s }) => ({ ...s, placesRestantes: Math.max(0, s.placesTotal - s.placesPrises - reservations.reduce((n, r) => n + r.nbPersonnes, 0)) })) };
}

export const listExperiences = endpoint(async (request: Request) => {
  const type = new URL(request.url).searchParams.get('type');
  if (type && !['atelier', 'good_tour', 'immersion'].includes(type)) throw new ApiError(400, 'Type inconnu');
  return json(await experiencesActives(type ?? undefined));
});

export const getExperience = endpoint(async (_request: Request, context: RouteContext) => {
  const { id: slug } = await context.params;
  const result = await experiencePublique(slug);
  if (!result) throw new ApiError(404, 'Expérience introuvable');
  return json(result);
});

export const createExperience = endpoint(async (request: Request) => {
  const denied = requireAdmin(request); if (denied) return denied;
  return json(await prisma.experience.create({ data: experienceSchema.parse(await request.json()) }), 201);
});

export const updateExperience = endpoint(async (request: Request, context: RouteContext) => {
  const denied = requireAdmin(request); if (denied) return denied;
  const id = positiveId((await context.params).id);
  const data = experienceUpdateSchema.parse(await request.json());
  return json(await prisma.$transaction(async tx => {
    await tx.experience.update({ where: { id }, data });
    if (data.capaciteMax && await tx.session.count({ where: { experienceId: id, placesTotal: { gt: data.capaciteMax }, dateDebut: { gt: new Date() }, statut: { not: 'annulee' } } })) throw new ApiError(409, 'Des sessions dépassent cette capacité');
    return tx.experience.findUniqueOrThrow({ where: { id } });
  }));
});

export const deleteExperience = endpoint(async (request: Request, context: RouteContext) => {
  const denied = requireAdmin(request); if (denied) return denied;
  await prisma.experience.delete({ where: { id: positiveId((await context.params).id) } });
  return json({ ok: true });
});

export const listSessions = endpoint(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const available = params.get('disponible');
  if (available && !['true', 'false'].includes(available)) throw new ApiError(400, 'disponible doit être true ou false');
  const sessions = await prisma.session.findMany({ where: { dateDebut: { gt: new Date() }, statut: { not: 'annulee' }, experience: { actif: true, ...(params.get('experience') ? { slug: params.get('experience')! } : {}) } }, include: { experience: true, reservations: { where: { statut: 'en_attente' }, select: { nbPersonnes: true } } }, orderBy: { dateDebut: 'asc' } });
  const results = sessions.map(({ experience, reservations, ...s }) => ({ ...s, prixCents: s.prixCents ?? experience.prixCents, placesRestantes: Math.max(0, s.placesTotal - s.placesPrises - reservations.reduce((n, r) => n + r.nbPersonnes, 0)) }));
  return json(available === 'true' ? results.filter(s => s.statut === 'ouverte' && s.placesRestantes > 0) : results);
});

export const createSession = endpoint(async (request: Request) => {
  const denied = requireAdmin(request); if (denied) return denied;
  const data = sessionSchema.parse(await request.json());
  if (data.dateDebut <= new Date() || data.dateFin <= data.dateDebut) throw new ApiError(400, 'Dates de session invalides');
  return json(await prisma.$transaction(async tx => {
    const experience = await tx.experience.update({ where: { id: data.experienceId }, data: { id: data.experienceId } });
    if (data.placesTotal > experience.capaciteMax) throw new ApiError(400, 'Capacité supérieure à celle de l’expérience');
    return tx.session.create({ data });
  }), 201);
});

export const updateSession = endpoint(async (request: Request, context: RouteContext) => {
  const denied = requireAdmin(request); if (denied) return denied;
  const id = positiveId((await context.params).id);
  const data = sessionUpdateSchema.parse(await request.json());
  return json(await prisma.$transaction(async tx => {
    const current = await lockSession(tx, id);
    const occupied = current.placesPrises + await pendingSeats(tx, id);
    const next = { ...current, ...data };
    if (next.dateFin <= next.dateDebut || (data.dateDebut && next.dateDebut <= new Date())) throw new ApiError(400, 'Dates invalides');
    if (occupied && (data.dateDebut || data.dateFin || data.lieu || data.statut === 'annulee')) throw new ApiError(409, 'Annuler les réservations avant de déplacer ou annuler cette session');
    if (next.placesTotal < occupied || next.placesTotal > current.experience.capaciteMax) throw new ApiError(409, 'Capacité incompatible avec les réservations ou l’expérience');
    return tx.session.update({ where: { id }, data });
  }));
});

export const deleteSession = endpoint(async (request: Request, context: RouteContext) => {
  const denied = requireAdmin(request); if (denied) return denied;
  await prisma.session.delete({ where: { id: positiveId((await context.params).id) } });
  return json({ ok: true });
});
