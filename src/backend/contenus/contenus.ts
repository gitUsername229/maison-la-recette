import 'server-only';
import { prisma } from '@/backend/db/prisma';
import type { TypeEpisode } from '@/backend/podcast/emission';

// Lectures publiques (pages du site). Articles du blog : articles.ts.

export function listerAvis({ limite }: { limite?: number } = {}) {
  return prisma.avis.findMany({ where: { visible: true }, orderBy: { id: 'desc' }, take: limite });
}

export function listerPartenaires() {
  return prisma.partenaire.findMany({ where: { visible: true }, orderBy: { nom: 'asc' } });
}

/** Épisodes publiés, les plus récents d'abord, éventuellement d'un seul type (page podcast). */
export function listerEpisodes({ type, saison, limite }: { type?: TypeEpisode; saison?: number; limite?: number } = {}) {
  return prisma.episode.findMany({ where: { type, saison }, orderBy: [{ datePublication: 'desc' }, { id: 'desc' }], take: limite });
}

/** Saisons qui ont des épisodes (de ce type), la plus récente d'abord : liste déroulante de la page podcast. */
export async function saisonsDisponibles(type?: TypeEpisode) {
  const saisons = await prisma.episode.findMany({ where: { type }, distinct: ['saison'], select: { saison: true }, orderBy: { saison: 'desc' } });
  return saisons.map(s => s.saison);
}

/** Nombre d'épisodes de chaque type (onglets de la page podcast). */
export async function compterEpisodesParType(): Promise<Record<TypeEpisode, number>> {
  const groupes = await prisma.episode.groupBy({ by: ['type'], _count: { _all: true } });
  const compte = (type: TypeEpisode) => groupes.find(g => g.type === type)?._count._all ?? 0;
  return { complet: compte('complet'), extrait: compte('extrait'), replay: compte('replay') };
}
