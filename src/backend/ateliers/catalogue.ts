import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/backend/db/prisma';
import { reservationsBloquantes } from '@/backend/places';

// Lectures des pages serveur du front.
/** Expériences actives ; `inclureMasquees` (admin) ajoute les expériences désactivées. */
export function listerExperiences(type?: string, inclureMasquees = false) {
  return prisma.experience.findMany({ where: { ...(inclureMasquees ? {} : { actif: true }), ...(type ? { type } : {}) }, orderBy: { id: 'asc' } });
}

/** Sessions à venir (hors annulées), avec les réservations qui bloquent encore des places. */
const sessionsAVenir = () => ({
  where: { dateDebut: { gt: new Date() }, statut: { not: 'annulee' } },
  orderBy: { dateDebut: 'asc' },
  include: { reservations: { where: reservationsBloquantes(), select: { nbPersonnes: true } } },
}) satisfies Prisma.Experience$sessionsArgs;

type SessionAVenir = Prisma.SessionGetPayload<{ include: { reservations: { select: { nbPersonnes: true } } } }>;

/** Places restantes = places totales − vendues − en cours de paiement. */
const avecPlacesRestantes = ({ reservations, ...session }: SessionAVenir) => ({
  ...session,
  placesRestantes: Math.max(0, session.placesTotal - session.placesPrises - reservations.reduce((n, r) => n + r.nbPersonnes, 0)),
});

export async function experiencePublique(slug: string) {
  const result = await prisma.experience.findUnique({ where: { slug }, include: { sessions: sessionsAVenir() } });
  if (!result?.actif) return null;
  // La galerie d'une expérience = les images de sa page.
  const images = await prisma.image.findMany({ where: { page: `/experiences/${slug}` }, orderBy: { ordre: 'asc' } });
  return { ...result, images, sessions: result.sessions.map(avecPlacesRestantes) };
}

/** Dates ouvertes où il reste de la place, au prix de la session (sinon celui de l'expérience). */
const datesOuvertes = (sessions: SessionAVenir[], prixExperience: number) => sessions
  .map(avecPlacesRestantes)
  .filter(s => s.statut === 'ouverte' && s.placesRestantes > 0)
  .map(s => ({ ...s, prixCents: s.prixCents ?? prixExperience }));

/** Expériences visibles avec leurs prochaines dates ouvertes où il reste de la place (blocs du blog). */
export async function experiencesAvecProchainesDates(ids: number[], nombreDeDates = 3) {
  const experiences = await prisma.experience.findMany({ where: { id: { in: ids }, actif: true }, include: { sessions: sessionsAVenir() }, orderBy: { id: 'asc' } });
  return experiences.map(({ sessions, ...experience }) => ({
    ...experience,
    prochainesDates: datesOuvertes(sessions, experience.prixCents).slice(0, nombreDeDates),
  }));
}

/**
 * Cartes de /experiences : chaque expérience visible, sa prochaine date ouverte et le nombre d'autres dates.
 * Sans date ouverte, ou pour une expérience sur devis, `prochaineDate` est vide : la carte propose un devis.
 */
export async function cartesExperiences() {
  const experiences = await prisma.experience.findMany({ where: { actif: true }, include: { sessions: sessionsAVenir() }, orderBy: { id: 'asc' } });
  return experiences.map(({ sessions, ...experience }) => {
    const dates = experience.reservableEnLigne ? datesOuvertes(sessions, experience.prixCents) : [];
    return { ...experience, prochaineDate: dates[0] ?? null, autresDates: Math.max(0, dates.length - 1) };
  });
}

/** Photos des expériences visibles (galeries, puis couvertures), sans doublon : mosaïque « Pour les entreprises ». */
export async function photosDesExperiences(nombre = 4) {
  const experiences = await prisma.experience.findMany({ where: { actif: true }, orderBy: { id: 'asc' }, select: { slug: true, image: true, imageAlt: true } });
  const galeries = await prisma.image.findMany({
    where: { page: { in: experiences.map(e => `/experiences/${e.slug}`) } }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }], select: { url: true, alt: true },
  });
  const photos = [...galeries, ...experiences.filter(e => e.image).map(e => ({ url: e.image, alt: e.imageAlt }))];
  return photos.filter((photo, i) => photos.findIndex(p => p.url === photo.url) === i).slice(0, nombre);
}

/** Sessions passées (hors annulées) des expériences visibles, la plus récente d'abord : « Expériences passées ». */
export function sessionsPassees() {
  return prisma.session.findMany({
    where: { dateDebut: { lt: new Date() }, statut: { not: 'annulee' }, experience: { actif: true } },
    orderBy: { dateDebut: 'desc' },
    select: { id: true, dateDebut: true, lieu: true, experience: { select: { slug: true, type: true, titre: true, image: true, imageAlt: true, dureeMin: true } } },
  });
}
