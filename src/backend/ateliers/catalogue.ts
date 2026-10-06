import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/backend/db/prisma';
import { estAdmin, exigerAdmin } from '@/backend/auth/acces';
import { ApiError, endpoint, json, pluriel, positiveId, type RouteContext } from '@/backend/http';
import { experienceSchema, experienceUpdateSchema, sessionSchema, sessionUpdateSchema } from './validation';
import { placesBloquees, reservationsBloquantes } from '@/backend/places';
import { lockSession } from './inventory';

// Utilisées par les routes /api et par les pages serveur du front.
/** Expériences actives ; `inclureMasquees` (admin) ajoute les expériences désactivées. */
export function listerExperiences(type?: string, inclureMasquees = false) {
  return prisma.experience.findMany({ where: { ...(inclureMasquees ? {} : { actif: true }), ...(type ? { type } : {}) }, orderBy: { id: 'asc' } });
}

export async function experiencePublique(slug: string) {
  const result = await prisma.experience.findUnique({ where: { slug }, include: { sessions: { where: { dateDebut: { gt: new Date() }, statut: { not: 'annulee' } }, orderBy: { dateDebut: 'asc' }, include: { reservations: { where: reservationsBloquantes(), select: { nbPersonnes: true } } } } } });
  if (!result?.actif) return null;
  // La galerie d'une expérience = les images de sa page.
  const images = await prisma.image.findMany({ where: { page: `/experiences/${slug}` }, orderBy: { ordre: 'asc' } });
  return { ...result, images, sessions: result.sessions.map(({ reservations, ...s }) => ({ ...s, placesRestantes: Math.max(0, s.placesTotal - s.placesPrises - reservations.reduce((n, r) => n + r.nbPersonnes, 0)) })) };
}

export const listExperiences = endpoint(async (request: Request) => {
  const type = new URL(request.url).searchParams.get('type');
  if (type && !['atelier', 'good_tour', 'immersion'].includes(type)) throw new ApiError(400, 'Type inconnu');
  return json(await listerExperiences(type ?? undefined, await estAdmin(request)));
});

export const getExperience = endpoint(async (_request: Request, context: RouteContext) => {
  const { id: slug } = await context.params;
  const result = await experiencePublique(slug);
  if (!result) throw new ApiError(404, 'Expérience introuvable');
  return json(result);
});

export const createExperience = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  return json(await prisma.experience.create({ data: experienceSchema.parse(await request.json()) }), 201);
});

export const updateExperience = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = positiveId((await context.params).id);
  const data = experienceUpdateSchema.parse(await request.json());
  return json(await prisma.$transaction(async tx => {
    await tx.experience.update({ where: { id }, data });
    if (data.capaciteMax && await tx.session.count({ where: { experienceId: id, placesTotal: { gt: data.capaciteMax }, dateDebut: { gt: new Date() }, statut: { not: 'annulee' } } })) throw new ApiError(409, 'Des sessions dépassent cette capacité');
    return tx.experience.findUniqueOrThrow({ where: { id } });
  }));
});

export const deleteExperience = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = positiveId((await context.params).id);
  // Ses sessions portent les réservations (historique, comptabilité) : on masque au lieu de supprimer.
  const sessions = await prisma.session.count({ where: { experienceId: id } });
  if (sessions) throw new ApiError(409, `Cette expérience a ${pluriel(sessions, 'session')} (et leurs réservations) : elle ne peut pas être supprimée, pour garder l’historique. Masquez-la : elle n’apparaîtra plus sur le site.`, { suggestion: 'masquer' });
  await prisma.experience.delete({ where: { id } });
  return json({ ok: true });
});

export const listSessions = endpoint(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const available = params.get('disponible');
  if (available && !['true', 'false'].includes(available)) throw new ApiError(400, 'disponible doit être true ou false');
  // Un admin voit aussi les sessions passées, annulées ou d'expériences masquées,
  // avec le prix propre à la session (null = prix de l'expérience).
  const admin = await estAdmin(request);
  const experience = params.get('experience') ? { slug: params.get('experience')! } : {};
  const where: Prisma.SessionWhereInput = admin ? { experience } : { dateDebut: { gt: new Date() }, statut: { not: 'annulee' }, experience: { actif: true, ...experience } };
  const sessions = await prisma.session.findMany({ where, include: { experience: true, reservations: { where: reservationsBloquantes(), select: { nbPersonnes: true } } }, orderBy: { dateDebut: admin ? 'desc' : 'asc' } });
  const results = sessions.map(({ experience, reservations, ...s }) => ({ ...s, experience: { titre: experience.titre, slug: experience.slug }, prixCents: admin ? s.prixCents : s.prixCents ?? experience.prixCents, placesRestantes: Math.max(0, s.placesTotal - s.placesPrises - reservations.reduce((n, r) => n + r.nbPersonnes, 0)) }));
  return json(available === 'true' ? results.filter(s => s.statut === 'ouverte' && s.placesRestantes > 0) : results);
});

export const createSession = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const data = sessionSchema.parse(await request.json());
  if (data.dateDebut <= new Date() || data.dateFin <= data.dateDebut) throw new ApiError(400, 'Dates de session invalides');
  return json(await prisma.$transaction(async tx => {
    const experience = await tx.experience.update({ where: { id: data.experienceId }, data: { id: data.experienceId } });
    if (data.placesTotal > experience.capaciteMax) throw new ApiError(400, 'Capacité supérieure à celle de l’expérience');
    return tx.session.create({ data });
  }), 201);
});

export const updateSession = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = positiveId((await context.params).id);
  const data = sessionUpdateSchema.parse(await request.json());
  return json(await prisma.$transaction(async tx => {
    const current = await lockSession(tx, id);
    const occupied = current.placesPrises + await placesBloquees(tx, id);
    const next = { ...current, ...data };
    // Le formulaire renvoie tous les champs : seules les vraies modifications comptent.
    const debutChange = data.dateDebut !== undefined && data.dateDebut.getTime() !== current.dateDebut.getTime();
    const deplacee = debutChange || (data.dateFin !== undefined && data.dateFin.getTime() !== current.dateFin.getTime()) || (data.lieu !== undefined && data.lieu !== current.lieu);
    if (next.dateFin <= next.dateDebut) throw new ApiError(400, 'La fin doit être après le début.', { champ: 'dateFin' });
    if (debutChange && next.dateDebut <= new Date()) throw new ApiError(400, 'La nouvelle date de début doit être dans le futur.', { champ: 'dateDebut' });
    if (occupied && (deplacee || (data.statut === 'annulee' && current.statut !== 'annulee'))) throw new ApiError(409, `Cette session a déjà ${pluriel(occupied, 'place')} vendue(s) ou en cours de paiement : elle ne peut être ni déplacée ni annulée. Fermez-la, ou annulez d’abord les réservations.`);
    if (next.placesTotal < occupied) throw new ApiError(409, `Déjà ${pluriel(occupied, 'place')} vendue(s) ou en cours de paiement : le nombre de places ne peut pas descendre sous ${occupied}.`, { champ: 'placesTotal' });
    if (next.placesTotal > current.experience.capaciteMax) throw new ApiError(409, `Le nombre de places ne peut pas dépasser la capacité de l’expérience (${current.experience.capaciteMax} participants).`, { champ: 'placesTotal' });
    return tx.session.update({ where: { id }, data });
  }));
});

export const deleteSession = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = positiveId((await context.params).id);
  // Les réservations ne sont jamais supprimées (historique, comptabilité) : on ferme la session à la place.
  const reservations = await prisma.reservation.count({ where: { sessionId: id } });
  if (reservations) throw new ApiError(409, `Cette session a ${pluriel(reservations, 'réservation')} : elle ne peut pas être supprimée. Fermez-la pour arrêter les réservations.`, { suggestion: 'fermer' });
  await prisma.session.delete({ where: { id } });
  return json({ ok: true });
});
