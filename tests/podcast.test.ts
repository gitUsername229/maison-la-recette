import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, beforeEach, test } from 'node:test';

let flux: typeof import('../src/backend/podcast/flux');
let ausha: typeof import('../src/backend/podcast/episodes');
let xml: string;

before(async () => {
  process.env.AUSHA_RSS_URL = 'https://feed.ausha.co/flux-de-test';
  flux = await import('../src/backend/podcast/flux');
  ausha = await import('../src/backend/podcast/episodes');
  xml = await readFile(new URL('./donnees/flux-ausha.xml', import.meta.url), 'utf8');
});

beforeEach(() => ausha.viderCacheEpisodes());

const lire = (contenu: string) => flux.lireFlux(contenu);

test('le flux : type détecté depuis le titre, texte commun retiré, durée, saison et lecteur lus', async t => {
  t.mock.method(console, 'warn', () => undefined); // l'épisode sans fichier audio est signalé
  const episodes = lire(xml);
  const parGuid = Object.fromEntries(episodes.map(e => [e.guid, e]));

  assert.equal(episodes.length, 5, 'l’épisode sans fichier audio est ignoré');
  assert.deepEqual(episodes.map(e => e.type), ['complet', 'extrait', 'replay', 'extrait', 'extrait']);

  const complet = parGuid['guid-complet'];
  assert.equal(complet.titre, 'Jean Marie Pédron, cueilleur d\'algues : celui qui donne le goût des algues');
  assert.equal(complet.resume, 'Dulse, nori & kombu… C\'est un aliment d’avenir.\nVoici la recette de Jean-Marie Pédron.');
  assert.match(complet.description, /Hébergé par Ausha/); // la description complète est gardée
  assert.deepEqual([complet.saison, complet.numero, complet.dureeMin], [3, 25, 53]);
  assert.equal(complet.embedUrl, 'https://player.ausha.co/?podcastId=lDLw5U6GYgxw&display=horizontal&v=2');
  assert.equal(complet.audioUrl, 'https://audio.ausha.co/lDLw5U6GYgxw.mp3?t=1'); // fichier lu par le lecteur sur mesure
  assert.equal(complet.image, 'https://image.ausha.co/pedron_1400x1400.jpeg?t=2');

  assert.equal(parGuid['guid-extrait'].resume, 'Dans cet extrait, Jean-Marie parle des algues.');
  assert.equal(parGuid['guid-extrait'].numero, 0, 'pas de numéro dans le flux');
  assert.equal(parGuid['guid-extrait'].image, 'https://image.ausha.co/couverture_1400x1400.jpeg?t=1', 'image de l’émission par défaut');
  assert.equal(parGuid['guid-rediffusion'].dureeMin, 62);
  assert.equal(parGuid['guid-teaser'].dureeMin, 3);
  assert.equal(parGuid['guid-bande-annonce'].resume, 'Cette annonce est un avant-goût de la recette.');
});

test('émojis retirés des textes venus d’Ausha, symboles typographiques gardés', () => {
  const cas: [string, string][] = [
    ['🎧 Écoutez l’épisode', 'Écoutez l’épisode'], ['Dulse, nori 🌊 kombu', 'Dulse, nori kombu'], ['👩‍💻 Développeuse', 'Développeuse'],
    ['Bravo 🇫🇷 !', 'Bravo !'], ['⚠️ Attention', 'Attention'], ['1️⃣ premier', 'premier'], ['🎙️ Micro', 'Micro'], ['Ligne\n🙏 Merci', 'Ligne\nMerci'],
    ['© 2026 Maison', '© 2026 Maison'], ['★★★★☆', '★★★★☆'], ['Prix → 45 €', 'Prix → 45 €'], ['⚠ sans sélecteur', '⚠ sans sélecteur'],
  ];
  for (const [avant, apres] of cas) assert.equal(flux.sansEmojis(avant), apres, avant);
  assert.ok(lire(xml).every(e => !/\p{Emoji_Presentation}/u.test(e.titre + e.description + e.resume)));
});

test('titres d’épisodes : nom de l’invité en grand, sujet dessous, préfixes de type retirés', async () => {
  const { decouperTitre } = await import('../src/frontend/format');
  const cas: [string, string, string][] = [
    ['Jean Marie Pédron, cueilleur d\'algues : celui qui donne le goût des algues', 'Jean Marie Pédron', 'Cueilleur d\'algues : celui qui donne le goût des algues'],
    ['Pierre-André Aubert : celui qui a créé le premier restaurant solaire', 'Pierre-André Aubert', 'Celui qui a créé le premier restaurant solaire'],
    ['[EXTRAIT 1 - Jean-Marie Pédron ] - Les algues vont-elles arriver dans nos assiettes demain ?', 'Jean-Marie Pédron', 'Les algues vont-elles arriver dans nos assiettes demain ?'],
    ['REPLAY - [EXTRAIT 2 - Christian Têtedoie ] Pourquoi s\'engager ?', 'Christian Têtedoie', 'Pourquoi s\'engager ?'],
    ['REDIFFUSION : Katia Tardy, co-fondatrice de Kignon', 'Katia Tardy', 'Co-fondatrice de Kignon'],
    ['EXTRAIT 4 - Comment mieux manger, sans se ruiner ?', 'Comment mieux manger, sans se ruiner ?', ''],
    ['[EXTRAIT 2] - Les 5 conseils de Charles Guirriec pour choisir ses produits de la mer', 'Les 5 conseils de Charles Guirriec pour choisir ses produits de la mer', ''],
  ];
  for (const [titre, nom, sujet] of cas) assert.deepEqual(decouperTitre(titre), { nom, sujet }, titre);
});

/** Faux fetch : le flux de test, ou une panne ; compte les lectures. */
function faux(reponse: () => Response) {
  const appels: string[] = [];
  const lire = (async (url: string | URL | Request) => { appels.push(String(url)); return reponse(); }) as typeof fetch;
  return { lire, appels };
}

test('épisodes lus dans le flux Ausha, gardés 30 minutes, une seule lecture pour des affichages simultanés', async t => {
  t.mock.method(console, 'warn', () => undefined);
  const { lire, appels } = faux(() => new Response(xml));
  const [a, b] = await Promise.all([ausha.episodesAusha({ lire, maintenant: 0 }), ausha.episodesAusha({ lire, maintenant: 0 })]);
  assert.equal(appels.length, 1);
  assert.deepEqual(appels, ['https://feed.ausha.co/flux-de-test']);
  assert.ok(a && a.length > 0 && a === b);
  assert.deepEqual(a.map(e => e.datePublication.getTime()), a.map(e => e.datePublication.getTime()).toSorted((x, y) => y - x));

  await ausha.episodesAusha({ lire, maintenant: ausha.DUREE_CACHE_MS - 1 });
  assert.equal(appels.length, 1, 'encore en mémoire');
  await ausha.episodesAusha({ lire, maintenant: ausha.DUREE_CACHE_MS });
  assert.equal(appels.length, 2, 'relu après 30 minutes');
});

test('Ausha injoignable : la dernière lecture reste affichée ; sans aucune lecture, null', async t => {
  t.mock.method(console, 'warn', () => undefined);
  t.mock.method(console, 'error', () => undefined);
  const panne = faux(() => new Response('erreur', { status: 503 }));
  assert.equal(await ausha.episodesAusha({ lire: panne.lire, maintenant: 0 }), null);

  const bon = faux(() => new Response(xml));
  const lus = await ausha.episodesAusha({ lire: bon.lire, maintenant: 0 });
  assert.equal(await ausha.episodesAusha({ lire: panne.lire, maintenant: ausha.DUREE_CACHE_MS * 2 }), lus);
});

test('sans AUSHA_RSS_URL : pas de lecture, null', async t => {
  t.mock.method(console, 'warn', () => undefined);
  const avant = process.env.AUSHA_RSS_URL;
  t.after(() => { process.env.AUSHA_RSS_URL = avant; });
  delete process.env.AUSHA_RSS_URL;
  const { lire, appels } = faux(() => new Response(xml));
  assert.equal(await ausha.episodesAusha({ lire }), null);
  assert.equal(appels.length, 0);
});

test('saisons (la plus récente d’abord), filtres et compteurs de la page podcast', async t => {
  t.mock.method(console, 'warn', () => undefined);
  const episodes = lire(xml);
  const saisons = ausha.saisonsDisponibles(episodes);
  assert.deepEqual(saisons, [...new Set(episodes.map(e => e.saison))].sort((a, b) => b - a));
  for (const saison of ausha.saisonsDisponibles(episodes, 'extrait')) {
    assert.ok(ausha.filtrerEpisodes(episodes, { type: 'extrait', saison }).length > 0);
  }
  const compteurs = ausha.compterParType(episodes);
  assert.equal(compteurs.complet + compteurs.extrait + compteurs.replay, episodes.length);
  const [premier] = episodes;
  assert.deepEqual(Object.keys(ausha.pourLecteur(premier)).sort(), ['audioUrl', 'datePublication', 'dureeMin', 'embedUrl', 'id', 'image', 'resume', 'titre']);
  assert.equal(ausha.pourLecteur(premier).id, premier.guid);
});

