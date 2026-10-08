import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let flux: typeof import('../src/backend/podcast/flux');
let xml: string;

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  flux = await import('../src/backend/podcast/flux');
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
