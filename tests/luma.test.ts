import assert from 'node:assert/strict';
import { before, beforeEach, test } from 'node:test';

let client: typeof import('../src/backend/luma/client');
let simulation: typeof import('../src/backend/luma/simulation');

before(async () => {
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  client = await import('../src/backend/luma/client');
  simulation = await import('../src/backend/luma/simulation');
});

beforeEach(() => {
  delete process.env.LUMA_MODE;
  delete process.env.LUMA_API_KEY;
  client.viderCacheLuma();
});

const MAINTENANT = new Date('2026-10-08T10:00:00Z');
const cle = { 'x-luma-api-key': 'simulation' };
const get = (chemin: string, entetes: Record<string, string> = cle) =>
  new Request(`http://localhost:3000/api/luma-simule/v1${chemin}`, { headers: entetes });
type Liste = { entries: Record<string, unknown>[]; has_more: boolean; next_cursor?: string };

/** fetch du site branché sur le faux serveur (comme en développement), qui garde les requêtes reçues. */
function fauxFetch() {
  const requetes: { url: URL; cle: string | null }[] = [];
  const lire = (async (entree: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(entree));
    const entetes = new Headers(init?.headers);
    requetes.push({ url, cle: entetes.get('x-luma-api-key') });
    const requete = new Request(url, { headers: entetes });
    return url.pathname.endsWith('/events/get') ? simulation.detailSimule(requete, MAINTENANT) : simulation.listeSimulee(requete, MAINTENANT);
  }) as typeof fetch;
  return { lire, requetes };
}

test('faux serveur : clé exigée, champs et pagination de la vraie API (liste des événements)', async () => {
  assert.equal(simulation.listeSimulee(get('/calendars/events/list', {}), MAINTENANT).status, 401);
  const page1 = await simulation.listeSimulee(get(`/calendars/events/list?after=${MAINTENANT.toISOString()}&sort_direction=asc&pagination_limit=3`), MAINTENANT).json() as Liste;
  assert.equal(page1.entries.length, 3);
  assert.equal(page1.has_more, true);
  for (const champ of ['id', 'name', 'start_at', 'end_at', 'timezone', 'url', 'display_price', 'spots_remaining', 'geo_address_json', 'tags', 'visibility', 'registration_open']) {
    assert.ok(champ in page1.entries[0], champ);
  }
  assert.ok(!('description' in page1.entries[0]), 'la description est un champ du détail');
  const debuts = page1.entries.map(e => String(e.start_at));
  assert.deepEqual(debuts, debuts.toSorted());
  assert.ok(debuts.every(d => new Date(d) >= MAINTENANT));

  const page2 = await simulation.listeSimulee(get(`/calendars/events/list?after=${MAINTENANT.toISOString()}&sort_direction=asc&pagination_limit=3&pagination_cursor=${page1.next_cursor}`), MAINTENANT).json() as Liste;
  assert.equal(page2.has_more, false);
  assert.equal(page2.next_cursor, undefined);

  const passes = await simulation.listeSimulee(get(`/calendars/events/list?before=${MAINTENANT.toISOString()}&sort_direction=desc`), MAINTENANT).json() as Liste;
  assert.ok(passes.entries.length >= 2 && passes.entries.every(e => new Date(String(e.start_at)) < MAINTENANT));
  assert.deepEqual(passes.entries.map(e => String(e.start_at)), passes.entries.map(e => String(e.start_at)).toSorted().reverse());
});

test('faux serveur : détail d’un événement (event_id obligatoire, 404 si inconnu)', async () => {
  assert.equal(simulation.detailSimule(get('/events/get'), MAINTENANT).status, 400);
  assert.equal(simulation.detailSimule(get('/events/get?event_id=evt-inconnu'), MAINTENANT).status, 404);
  const detail = await simulation.detailSimule(get('/events/get?event_id=evt-SimAtelier01'), MAINTENANT).json() as Record<string, unknown>;
  assert.equal(detail.name, 'Atelier cuisine anti-gaspi');
  assert.ok(typeof detail.description_md === 'string' && Array.isArray(detail.hosts));
  assert.equal(detail.url, 'http://localhost:3000/luma-simule/evt-SimAtelier01');
});

test('client en simulation : événements à venir traduits pour l’affichage (prix, places, lieu, tags)', async () => {
  const { lire, requetes } = fauxFetch();
  const evenements = await client.evenementsLuma('a-venir', { lire, maintenant: MAINTENANT.getTime() });
  assert.ok(evenements && evenements.length >= 4);
  assert.equal(requetes[0].url.origin + requetes[0].url.pathname, 'http://localhost:3000/api/luma-simule/v1/calendars/events/list');
  assert.equal(requetes[0].cle, 'simulation');
  const [atelier] = evenements;
  assert.deepEqual({ titre: atelier.titre, prix: atelier.prix, places: atelier.placesRestantes, lieu: atelier.lieu, etiquettes: atelier.etiquettes }, {
    titre: 'Atelier cuisine anti-gaspi', prix: { centimes: 7000, devise: 'eur', libre: false }, places: 8, lieu: 'La Rochelle', etiquettes: ['Atelier'],
  });
  assert.ok(evenements.some(e => e.titre.startsWith('Food tour') && e.prix?.centimes === 6000));
  assert.ok(evenements.some(e => e.placesRestantes === null), 'sans limite de places');
  const detail = await client.evenementLuma('evt-SimFoodTour01', { lire });
  assert.equal(detail?.titre, 'Food tour : marché et producteurs');
});

test('client : réponses gardées 5 minutes ; Luma en panne → dernière réponse, sinon null (lien de secours)', async t => {
  t.mock.method(console, 'error', () => undefined);
  const { lire, requetes } = fauxFetch();
  const premiere = await client.evenementsLuma('a-venir', { lire, maintenant: 0 });
  await client.evenementsLuma('a-venir', { lire, maintenant: client.DUREE_CACHE_MS - 1 });
  assert.equal(requetes.length, 1);

  const panne = (async () => new Response('{}', { status: 503 })) as typeof fetch;
  assert.equal(await client.evenementsLuma('a-venir', { lire: panne, maintenant: client.DUREE_CACHE_MS * 3 }), premiere);
  assert.equal(await client.evenementsLuma('passes', { lire: panne, maintenant: 0 }), null);
  assert.equal(client.LIEN_LUMA, 'https://luma.com/larecette');
});

test('client en mode api : GET sur public-api.luma.com avec la clé ; sans clé, rien n’est demandé', async t => {
  t.mock.method(console, 'error', () => undefined);
  process.env.LUMA_MODE = 'api';
  const { lire, requetes } = fauxFetch();
  assert.equal(await client.evenementsLuma('a-venir', { lire }), null);
  assert.equal(requetes.length, 0, 'LUMA_API_KEY absent');

  process.env.LUMA_API_KEY = 'cle-de-test';
  await client.evenementsLuma('a-venir', { lire, maintenant: 1 });
  assert.equal(requetes[0].url.origin + requetes[0].url.pathname, 'https://public-api.luma.com/v1/calendars/events/list');
  assert.equal(requetes[0].cle, 'cle-de-test');
  assert.equal(requetes[0].url.searchParams.get('sort_direction'), 'asc');
  assert.equal(simulation.listeSimulee(get('/calendars/events/list'), MAINTENANT).status, 404, 'pas de faux serveur en mode api');
});
