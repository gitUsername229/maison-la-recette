import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { ApiError } from '@/backend/http';
import { TYPES_EPISODE, type TypeEpisode } from '@/backend/podcast/emission';
import { entierParametre, routesRessource } from './crud';
import { supprimerFichierOrphelin } from './images';
import { avisSchemas, episodeSchemas, partenaireSchemas } from './validation';

// Lectures publiques (pages du site) ; `tout` (admin) inclut les contenus masqués. Articles du blog : articles.ts.

export function listerAvis({ tout = false, limite }: { tout?: boolean; limite?: number } = {}) {
  return prisma.avis.findMany({ where: tout ? {} : { visible: true }, orderBy: { id: 'desc' }, take: limite });
}

export function listerPartenaires({ tout = false }: { tout?: boolean } = {}) {
  return prisma.partenaire.findMany({ where: tout ? {} : { visible: true }, orderBy: { nom: 'asc' } });
}

export const avis = routesRessource({
  schemas: avisSchemas,
  lister: (admin, params) => listerAvis({ tout: admin, limite: entierParametre(params, 'limit', 100) }),
  creer: data => prisma.avis.create({ data }),
  modifier: (id, data) => prisma.avis.update({ where: { id }, data }),
  supprimer: id => prisma.avis.delete({ where: { id } }),
});

export const partenaires = routesRessource({
  schemas: partenaireSchemas,
  lister: admin => listerPartenaires({ tout: admin }),
  creer: data => prisma.partenaire.create({ data }),
  modifier: async (id, data) => {
    const avant = await prisma.partenaire.findUniqueOrThrow({ where: { id }, select: { photo: true } });
    const partenaire = await prisma.partenaire.update({ where: { id }, data });
    if (partenaire.photo !== avant.photo) await supprimerFichierOrphelin(avant.photo);
    return partenaire;
  },
  supprimer: async id => supprimerFichierOrphelin((await prisma.partenaire.delete({ where: { id } })).photo),
});

const estTypeEpisode = (valeur: string | null): valeur is TypeEpisode => TYPES_EPISODE.some(type => type === valeur);

/** Épisodes publiés, les plus récents d'abord, éventuellement d'un seul type (page podcast, API). */
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

/** Épisodes : tous publics. Filtres ?type=complet|extrait|replay, ?saison=2 et ?limit=3. */
export const episodes = routesRessource({
  schemas: episodeSchemas,
  lister: (_admin, params) => {
    const type = params.get('type');
    if (type !== null && !estTypeEpisode(type)) throw new ApiError(400, 'Type d’épisode inconnu (complet, extrait ou replay)');
    return listerEpisodes({ type: type ?? undefined, saison: entierParametre(params, 'saison', 100), limite: entierParametre(params, 'limit', 200) });
  },
  creer: data => prisma.episode.create({ data }),
  modifier: (id, data) => prisma.episode.update({ where: { id }, data }),
  supprimer: id => prisma.episode.delete({ where: { id } }),
});
