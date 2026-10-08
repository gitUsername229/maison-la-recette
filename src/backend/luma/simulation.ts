import 'server-only';
import type { DetailEvenementLuma, EntreeListeLuma, EvenementLuma } from './types';
import { modeLuma } from './client';

// Faux serveur Luma (LUMA_MODE=simulation) : il répond aux deux GET utilisés par le site, avec les formats de la
// vraie API (voir types.ts). Les événements ci-dessous sont fictifs, datés par rapport au jour où la page est
// affichée (toujours des dates à venir et des dates passées). Leur lien mène à une page factice du site
// (/luma-simule/<id>), marquée « Simulation Luma ». Pour en ajouter : copier un bloc de SIMULES.

type Simule = {
  id: string;
  nom: string;
  jours: number;            // date par rapport à aujourd'hui (négatif : passé)
  heure: string;            // heure de début à Paris, ex : '18:30'
  duree: number;            // minutes
  prix: number | null;      // euros ; null : gratuit
  places: number | null;    // places restantes ; null : sans limite
  ville: string;
  etiquette: string;        // tag du calendrier Luma : relie l'événement à une expérience (src/contenu/experiences.ts)
  description: string;
};

const SIMULES: Simule[] = [
  { id: 'evt-SimAtelier01', nom: 'Atelier cuisine anti-gaspi', jours: 9, heure: '18:30', duree: 150, prix: 70, places: 8, ville: 'La Rochelle', etiquette: 'Atelier', description: 'Cuisiner avec ce qu’on jette d’habitude : fanes, pain sec, légumes fatigués.' },
  { id: 'evt-SimFoodTour01', nom: 'Food tour : marché et producteurs', jours: 16, heure: '10:00', duree: 180, prix: 60, places: 11, ville: 'La Rochelle', etiquette: 'Food tour', description: 'Une matinée au marché, à la rencontre de celles et ceux qui nous nourrissent.' },
  { id: 'evt-SimAtelier02', nom: 'Atelier cuisine anti-gaspi', jours: 30, heure: '10:00', duree: 150, prix: 70, places: 2, ville: 'La Rochelle', etiquette: 'Atelier', description: 'Cuisiner avec ce qu’on jette d’habitude : fanes, pain sec, légumes fatigués.' },
  { id: 'evt-SimFoodTour02', nom: 'Food tour : marché et producteurs', jours: 44, heure: '10:00', duree: 180, prix: 60, places: null, ville: 'La Rochelle', etiquette: 'Food tour', description: 'Une matinée au marché, à la rencontre de celles et ceux qui nous nourrissent.' },
  { id: 'evt-SimAtelier00', nom: 'Atelier cuisine anti-gaspi', jours: -20, heure: '18:30', duree: 150, prix: 70, places: 0, ville: 'La Rochelle', etiquette: 'Atelier', description: 'Cuisiner avec ce qu’on jette d’habitude.' },
  { id: 'evt-SimFoodTour00', nom: 'Food tour : marché et producteurs', jours: -45, heure: '10:00', duree: 180, prix: 60, places: 0, ville: 'La Rochelle', etiquette: 'Food tour', description: 'Une matinée au marché.' },
  { id: 'evt-SimAtelierAn', nom: 'Atelier cuisine anti-gaspi', jours: -300, heure: '18:30', duree: 150, prix: 70, places: 0, ville: 'La Rochelle', etiquette: 'Atelier', description: 'Cuisiner avec ce qu’on jette d’habitude.' },
];

const FUSEAU = 'Europe/Paris';
const CALENDRIER = 'cal-SimLaRecette';

/** Jour J + n à l'heure de Paris (« 18:30 »), en date UTC. */
function dateDeParis(jours: number, heure: string, maintenant: Date) {
  const jour = new Date(maintenant.getTime() + jours * 86_400_000).toLocaleDateString('en-CA', { timeZone: FUSEAU }); // AAAA-MM-JJ
  const approx = new Date(`${jour}T${heure}:00Z`);
  // Décalage de Paris ce jour-là (heure d'été ou d'hiver).
  const local = new Date(approx.toLocaleString('en-US', { timeZone: FUSEAU }));
  const utc = new Date(approx.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(approx.getTime() - (local.getTime() - utc.getTime()));
}

/** Champs communs à la liste et au détail. */
function evenement(s: Simule, origine: string, maintenant: Date): EvenementLuma {
  const debut = dateDeParis(s.jours, s.heure, maintenant);
  return {
    platform: 'luma',
    id: s.id,
    user_id: 'usr-SimJulie',
    calendar_id: CALENDRIER,
    start_at: debut.toISOString(),
    duration_interval: `PT${Math.floor(s.duree / 60)}H${s.duree % 60 ? `${s.duree % 60}M` : ''}`,
    end_at: new Date(debut.getTime() + s.duree * 60_000).toISOString(),
    created_at: new Date(debut.getTime() - 60 * 86_400_000).toISOString(),
    timezone: FUSEAU,
    name: s.nom,
    cover_url: `${origine}/images/demo/planche-tomates.jpg`,
    url: `${origine}/luma-simule/${s.id}`,
    visibility: 'public',
    location_type: 'offline',
    // Comme souvent sur Luma, l'adresse exacte n'est donnée qu'aux inscrits : la ville seulement.
    location_visibility: 'guests-only',
    waitlist_status: 'enabled',
    registration_open: s.jours > 0 && s.places !== 0,
    require_approval: false,
    spots_remaining: s.places,
    display_price: s.prix === null ? null : { amount: s.prix * 100, currency: 'eur', is_flexible: false },
    access: 'manage',
    geo_address_json: { address: s.ville, city: s.ville, region: 'Nouvelle-Aquitaine', country: 'France', city_state: `${s.ville}, Nouvelle-Aquitaine`, full_address: null },
    coordinate: null,
  };
}

/** Entrée de la liste : l'événement et ses tags (sans description ni organisateurs, champs du détail). */
const entree = (s: Simule, origine: string, maintenant: Date): EntreeListeLuma => ({
  ...evenement(s, origine, maintenant),
  tags: [{ id: `tag-${s.etiquette.toLowerCase().replace(/\W+/g, '-')}`, name: s.etiquette }],
  submitted_by: null,
});

/** Détail : l'événement, sa description et ses organisateurs. */
const detail = (s: Simule, origine: string, maintenant: Date): DetailEvenementLuma => ({
  ...evenement(s, origine, maintenant),
  description: s.description,
  description_md: s.description,
  hosts: [{ id: 'usr-SimJulie', name: 'Maison La recette', avatar_url: `${origine}/images/podcast/logo-la-recette.png` }],
});

const erreur = (statut: number, message: string) => Response.json({ message }, { status: statut });

/** Le faux serveur n'existe qu'en simulation, et exige l'en-tête x-luma-api-key comme la vraie API. */
function refus(request: Request) {
  if (modeLuma() !== 'simulation') return erreur(404, 'Not found');
  if (!request.headers.get('x-luma-api-key')) return erreur(401, 'Missing x-luma-api-key header.');
  return null;
}

/** GET /api/luma-simule/v1/calendars/events/list : after, before, sort_direction, pagination_limit, pagination_cursor. */
export function listeSimulee(request: Request, maintenant = new Date()) {
  const refusee = refus(request);
  if (refusee) return refusee;
  const url = new URL(request.url);
  const p = url.searchParams;
  const after = p.get('after') ? new Date(p.get('after')!) : null;
  const before = p.get('before') ? new Date(p.get('before')!) : null;
  const limite = Math.min(Math.max(Number(p.get('pagination_limit')) || 50, 1), 100);
  const depart = Number(p.get('pagination_cursor') ?? 0) || 0;
  const tous = SIMULES.map(s => entree(s, url.origin, maintenant))
    .filter(e => (!after || new Date(e.start_at) >= after) && (!before || new Date(e.start_at) < before))
    .sort((a, b) => (a.start_at < b.start_at ? -1 : 1) * (p.get('sort_direction')?.startsWith('desc') ? -1 : 1));
  const entries = tous.slice(depart, depart + limite);
  const suite = depart + limite < tous.length;
  return Response.json({ entries, has_more: suite, ...(suite ? { next_cursor: String(depart + limite) } : {}) });
}

/** GET /api/luma-simule/v1/events/get?event_id=evt-… */
export function detailSimule(request: Request, maintenant = new Date()) {
  const refusee = refus(request);
  if (refusee) return refusee;
  const url = new URL(request.url);
  const id = url.searchParams.get('event_id');
  if (!id) return erreur(400, 'event_id is required.');
  const simule = SIMULES.find(s => s.id === id);
  if (!simule) return erreur(404, 'Event not found.');
  return Response.json(detail(simule, url.origin, maintenant));
}
