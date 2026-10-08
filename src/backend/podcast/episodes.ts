import 'server-only';
import type { TypeEpisode } from './emission';
import { lireFlux, type EpisodeDuFlux } from './flux';

// Épisodes lus directement dans le flux RSS Ausha (AUSHA_RSS_URL), à l'affichage : rien à importer ni à saisir.
// La lecture est gardée en mémoire DUREE_CACHE_MS ; si Ausha ne répond pas, la dernière lecture réussie reste
// affichée. Sans aucune lecture réussie, les pages renvoient vers les plateformes d'écoute.

export type Episode = EpisodeDuFlux;

/** Durée pendant laquelle les épisodes lus sont réutilisés sans relire le flux. */
export const DUREE_CACHE_MS = 30 * 60_000;

let cache: { episodes: Episode[]; luLe: number } | undefined;
let lectureEnCours: Promise<Episode[] | null> | undefined;

/** Oublie les épisodes en mémoire (tests). */
export function viderCacheEpisodes() {
  cache = undefined;
  lectureEnCours = undefined;
}

async function lireAusha(lire: typeof fetch): Promise<Episode[] | null> {
  const url = process.env.AUSHA_RSS_URL;
  if (!url?.startsWith('https://feed.ausha.co/')) {
    console.warn('[podcast] AUSHA_RSS_URL absent ou invalide dans .env.local : épisodes non affichés.');
    return null;
  }
  try {
    const reponse = await lire(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (!reponse.ok) throw new Error(`réponse ${reponse.status}`);
    const episodes = lireFlux(await reponse.text());
    if (episodes.length === 0) throw new Error('aucun épisode lisible');
    return episodes.toSorted((a, b) => b.datePublication.getTime() - a.datePublication.getTime());
  } catch (erreur) {
    console.error('[podcast] flux Ausha injoignable :', erreur instanceof Error ? erreur.message : erreur);
    return null;
  }
}

/**
 * Tous les épisodes, les plus récents d'abord (en mémoire depuis moins de DUREE_CACHE_MS, sinon relus chez Ausha).
 * Null si le flux n'a jamais pu être lu. Plusieurs pages affichées en même temps ne déclenchent qu'une lecture.
 */
export async function episodesAusha({ lire = fetch, maintenant = Date.now() }: { lire?: typeof fetch; maintenant?: number } = {}): Promise<Episode[] | null> {
  if (cache && maintenant - cache.luLe < DUREE_CACHE_MS) return cache.episodes;
  lectureEnCours ??= lireAusha(lire).finally(() => { lectureEnCours = undefined; });
  const episodes = await lectureEnCours;
  if (episodes) cache = { episodes, luLe: maintenant };
  return episodes ?? cache?.episodes ?? null;
}

/** Épisode prêt pour le lecteur du site (composant client : date en texte, guid comme identifiant). */
export const pourLecteur = ({ guid, titre, resume, datePublication, dureeMin, image, embedUrl, audioUrl }: Episode) =>
  ({ id: guid, titre, resume, datePublication: datePublication.toISOString(), dureeMin, image, embedUrl, audioUrl });

/** Épisodes d'un type et d'une saison (filtres de la page podcast). */
export const filtrerEpisodes = (episodes: Episode[], { type, saison }: { type?: TypeEpisode; saison?: number }) =>
  episodes.filter(e => (!type || e.type === type) && (saison === undefined || e.saison === saison));

/** Saisons qui ont des épisodes (de ce type), la plus récente d'abord : liste déroulante de la page podcast. */
export const saisonsDisponibles = (episodes: Episode[], type?: TypeEpisode) =>
  [...new Set(filtrerEpisodes(episodes, { type }).map(e => e.saison))].sort((a, b) => b - a);

/** Nombre d'épisodes de chaque type (onglets de la page podcast). */
export const compterParType = (episodes: Episode[]): Record<TypeEpisode, number> => ({
  complet: filtrerEpisodes(episodes, { type: 'complet' }).length,
  extrait: filtrerEpisodes(episodes, { type: 'extrait' }).length,
  replay: filtrerEpisodes(episodes, { type: 'replay' }).length,
});
