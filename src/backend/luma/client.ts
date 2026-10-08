import 'server-only';
import { adresseDuSite } from '@/backend/site';
import { detailSchema, entreeListeSchema, listeSchema, type DetailEvenementLuma, type EntreeListeLuma } from './types';

// Client Luma unique, en lecture seule (GET) : les événements du calendrier de la cliente, qui les gère dans Luma.
// LUMA_MODE (dans .env.local) :
// - « simulation » (par défaut) : le faux serveur Luma du projet (/api/luma-simule/v1/…, données dans
//   src/backend/luma/simulation.ts), mêmes requêtes et mêmes formats de réponse que la vraie API ;
// - « api » : la vraie API (https://public-api.luma.com) avec la clé LUMA_API_KEY (abonnement Luma Plus).
//   Ce mode n'a pas pu être essayé faute de clé : les formats viennent de la spécification officielle.
// Les réponses sont gardées DUREE_CACHE_MS en mémoire ; si Luma ne répond pas, la dernière réponse reste affichée,
// et sans réponse du tout, les pages proposent le lien de secours LIEN_LUMA.

/** Page publique du calendrier Luma : lien de secours quand les événements ne peuvent pas être lus. */
export const LIEN_LUMA = 'https://luma.com/larecette';

export const API_LUMA = 'https://public-api.luma.com';

/** Durée pendant laquelle une réponse de Luma est réutilisée sans redemander. */
export const DUREE_CACHE_MS = 5 * 60_000;

export type ModeLuma = 'simulation' | 'api';

export const modeLuma = (): ModeLuma => (process.env.LUMA_MODE === 'api' ? 'api' : 'simulation');

/** Événement prêt à afficher (les champs de Luma traduits pour les pages du site). */
export type EvenementAffiche = {
  id: string;
  titre: string;
  debut: Date;
  fin: Date;
  lieu: string | null;
  prix: { centimes: number; devise: string; libre: boolean } | null; // null : gratuit
  placesRestantes: number | null;                                     // null : pas de limite de places
  inscriptionOuverte: boolean;
  url: string;                                                        // page Luma de l'événement (inscription)
  etiquettes: string[];                                               // tags du calendrier Luma
};

type Options = { lire?: typeof fetch; maintenant?: number };

/** Adresse d'une route de l'API Luma, vraie ou simulée. */
function adresse(chemin: string, parametres: Record<string, string>) {
  const url = modeLuma() === 'api' ? new URL(chemin, API_LUMA) : new URL(`/api/luma-simule${chemin}`, adresseDuSite());
  for (const [cle, valeur] of Object.entries(parametres)) url.searchParams.set(cle, valeur);
  return url;
}

/** GET vers Luma avec la clé (x-luma-api-key) ; lève une erreur si Luma répond mal ou pas du tout. */
async function getLuma(chemin: string, parametres: Record<string, string>, lire: typeof fetch): Promise<unknown> {
  const cle = modeLuma() === 'api' ? process.env.LUMA_API_KEY : 'simulation';
  if (!cle) throw new Error('LUMA_API_KEY absent de .env.local (obligatoire avec LUMA_MODE=api)');
  const reponse = await lire(adresse(chemin, parametres), {
    headers: { 'x-luma-api-key': cle, accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`${chemin} : réponse ${reponse.status}`);
  return reponse.json();
}

/** Lieu affiché : la ville (ou l'adresse) donnée par Luma, « En ligne » pour un événement sans lieu physique. */
function lieuAffiche({ geo_address_json: geo, location_type: type }: EntreeListeLuma | DetailEvenementLuma) {
  if (geo) return geo.city ?? geo.address;
  return type === 'offline' || type === 'missing' || type === 'unknown' ? null : 'En ligne';
}

/** Traduction d'un événement Luma pour l'affichage. */
export const versAffichage = (evenement: EntreeListeLuma | (DetailEvenementLuma & { tags?: never })): EvenementAffiche => ({
  id: evenement.id,
  titre: evenement.name,
  debut: new Date(evenement.start_at),
  fin: new Date(evenement.end_at),
  lieu: lieuAffiche(evenement),
  prix: evenement.display_price && { centimes: evenement.display_price.amount, devise: evenement.display_price.currency, libre: evenement.display_price.is_flexible },
  placesRestantes: evenement.spots_remaining,
  inscriptionOuverte: evenement.registration_open,
  url: evenement.url,
  etiquettes: evenement.tags?.map(t => t.name) ?? [],
});

const PAGES_MAX = 4; // 4 × 50 événements : bien au-delà du calendrier d'une petite structure

/** Liste des événements publics, toutes pages comprises ; un événement au format inattendu est ignoré (et signalé). */
async function lireListe(quand: 'a-venir' | 'passes', lire: typeof fetch, maintenant: number): Promise<EvenementAffiche[]> {
  const parametres: Record<string, string> = quand === 'a-venir'
    ? { after: new Date(maintenant).toISOString(), sort_column: 'start_at', sort_direction: 'asc', pagination_limit: '50' }
    : { before: new Date(maintenant).toISOString(), sort_column: 'start_at', sort_direction: 'desc', pagination_limit: '50' };
  const evenements: EvenementAffiche[] = [];
  for (let page = 0; page < PAGES_MAX; page++) {
    const { entries, has_more, next_cursor } = listeSchema.parse(await getLuma('/v1/calendars/events/list', parametres, lire));
    for (const brut of entries) {
      const entree = entreeListeSchema.safeParse(brut);
      if (!entree.success) console.warn('[luma] événement ignoré : format inattendu', entree.error.issues[0]?.path.join('.'));
      else if (entree.data.visibility === 'public') evenements.push(versAffichage(entree.data));
    }
    if (!has_more || !next_cursor) break;
    parametres.pagination_cursor = next_cursor;
  }
  return evenements;
}

const caches = new Map<string, { evenements: EvenementAffiche[]; luLe: number }>();

/** Oublie les réponses gardées en mémoire (tests). */
export const viderCacheLuma = () => caches.clear();

/**
 * Événements publics du calendrier : à venir (le plus proche d'abord) ou passés (le plus récent d'abord).
 * Null si Luma n'a jamais pu être lu : les pages affichent alors le lien de secours vers LIEN_LUMA.
 */
export async function evenementsLuma(quand: 'a-venir' | 'passes', { lire = fetch, maintenant = Date.now() }: Options = {}): Promise<EvenementAffiche[] | null> {
  const cle = `${modeLuma()}:${quand}`;
  const enMemoire = caches.get(cle);
  if (enMemoire && maintenant - enMemoire.luLe < DUREE_CACHE_MS) return enMemoire.evenements;
  try {
    const evenements = await lireListe(quand, lire, maintenant);
    caches.set(cle, { evenements, luLe: maintenant });
    return evenements;
  } catch (erreur) {
    console.error(`[luma] événements ${quand === 'a-venir' ? 'à venir' : 'passés'} illisibles (mode ${modeLuma()}) :`, erreur instanceof Error ? erreur.message : erreur);
    return enMemoire?.evenements ?? null;
  }
}

/** Détail d'un événement (GET /v1/events/get), ou null s'il est introuvable ou illisible. */
export async function evenementLuma(id: string, { lire = fetch }: Options = {}): Promise<(EvenementAffiche & { description: string }) | null> {
  try {
    const detail = detailSchema.parse(await getLuma('/v1/events/get', { event_id: id }, lire));
    return { ...versAffichage(detail), description: detail.description };
  } catch (erreur) {
    console.error('[luma] événement illisible :', erreur instanceof Error ? erreur.message : erreur);
    return null;
  }
}
