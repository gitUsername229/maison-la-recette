import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let flux: typeof import('../src/backend/podcast/flux');
let importation: typeof import('../src/backend/podcast/import');
let contenus: typeof import('../src/backend/contenus/contenus');
let xml: string;

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  flux = await import('../src/backend/podcast/flux');
  importation = await import('../src/backend/podcast/import');
  contenus = await import('../src/backend/contenus/contenus');
  xml = await readFile(new URL('./donnees/flux-ausha.xml', import.meta.url), 'utf8');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

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
  assert.equal(complet.image, 'https://image.ausha.co/pedron_1400x1400.jpeg?t=2');

  assert.equal(parGuid['guid-extrait'].resume, 'Dans cet extrait, Jean-Marie parle des algues.');
  assert.equal(parGuid['guid-extrait'].numero, 0, 'pas de numéro dans le flux');
  assert.equal(parGuid['guid-extrait'].image, 'https://image.ausha.co/couverture_1400x1400.jpeg?t=1', 'image de l’émission par défaut');
  assert.equal(parGuid['guid-rediffusion'].dureeMin, 62);
  assert.equal(parGuid['guid-teaser'].dureeMin, 3);
  assert.equal(parGuid['guid-bande-annonce'].resume, 'Cette annonce est un avant-goût de la recette.');
});

test('l’import ne crée pas de doublon et n’écrase jamais ce que l’admin a modifié', async t => {
  t.mock.method(console, 'warn', () => undefined);
  assert.deepEqual(await importation.importerEpisodes(lire(xml)), { crees: 5, misAJour: 0 });

  const saisieAdmin = { resume: 'Résumé réécrit par Julie', type: 'replay', invite: 'Jean-Marie Pédron', spotifyUrl: 'https://open.spotify.com/episode/x' };
  await prisma.episode.update({ where: { guid: 'guid-complet' }, data: saisieAdmin });

  const fluxModifie = xml.replace('celui qui donne le goût des algues', 'le goût des algues');
  assert.deepEqual(await importation.importerEpisodes(lire(fluxModifie)), { crees: 0, misAJour: 5 });
  assert.equal(await prisma.episode.count(), 5);

  const episode = await prisma.episode.findUniqueOrThrow({ where: { guid: 'guid-complet' } });
  assert.match(episode.titre, /: le goût des algues$/, 'le titre suit Ausha');
  assert.deepEqual({ resume: episode.resume, type: episode.type, invite: episode.invite, spotifyUrl: episode.spotifyUrl }, saisieAdmin);
});

test('l’API filtre par type et refuse un type inconnu', async () => {
  const lister = (chemin: string) => contenus.episodes.lister(requete(chemin));
  const extraits = await (await lister('/api/episodes?type=extrait')).json() as { type: string }[];
  assert.ok(extraits.length > 0 && extraits.every(e => e.type === 'extrait'));
  assert.equal((await lister('/api/episodes?type=bonus')).status, 400);
});

test('l’import depuis Ausha est réservé à l’admin et exige AUSHA_RSS_URL', async () => {
  assert.equal((await importation.importerDepuisAusha(requete('/api/episodes/import', { methode: 'POST' }))).status, 401);
  const avecCle = requete('/api/episodes/import', { methode: 'POST', entetes: { 'x-admin-key': process.env.ADMIN_KEY! } });
  assert.equal((await importation.importerDepuisAusha(avecCle)).status, 503); // pas de flux configuré dans les tests
});
