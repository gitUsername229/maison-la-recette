import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { before, beforeEach, test } from 'node:test';

let catalogue: typeof import('../src/backend/ateliers/catalogue');
let luma: typeof import('../src/backend/luma/client');
let simulation: typeof import('../src/backend/luma/simulation');
let contenu: typeof import('../src/contenu/experiences');
let photos: typeof import('../src/contenu/photos');

before(async () => {
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  catalogue = await import('../src/backend/ateliers/catalogue');
  luma = await import('../src/backend/luma/client');
  simulation = await import('../src/backend/luma/simulation');
  contenu = await import('../src/contenu/experiences');
  photos = await import('../src/contenu/photos');
});

beforeEach(() => luma.viderCacheLuma());

const evenement = (etiquettes: string[]) => ({
  id: 'evt-test', titre: 'Événement', debut: new Date(), fin: new Date(), lieu: null, prix: null,
  placesRestantes: null, inscriptionOuverte: true, url: 'https://luma.com/x', etiquettes,
});

test('contenu des expériences : slugs uniques et valides, étiquette Luma pour chaque expérience réservable, photos présentes', () => {
  const slugs = contenu.EXPERIENCES.map(e => e.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const experience of contenu.EXPERIENCES) {
    assert.match(experience.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.notEqual(experience.slug, 'entreprises', 'adresse réservée à l’onglet Entreprises');
    if (experience.reservation === 'luma') assert.ok(experience.etiquetteLuma, `${experience.slug} : etiquetteLuma`);
    for (const photo of [{ url: experience.image }, ...(photos.GALERIES_EXPERIENCES[experience.slug] ?? [])]) {
      assert.ok(existsSync(join('public', photo.url)), photo.url);
    }
  }
  assert.ok(Object.keys(photos.GALERIES_EXPERIENCES).every(slug => slugs.includes(slug)));
});

test('un événement Luma rejoint l’expérience qui porte son étiquette (sans tenir compte des majuscules)', () => {
  assert.equal(catalogue.experienceDe(evenement(['atelier']))?.slug, 'atelier-cuisine-anti-gaspi');
  assert.equal(catalogue.experienceDe(evenement(['Autre', 'Food tour']))?.slug, 'good-tour-marche-producteurs');
  assert.equal(catalogue.experienceDe(evenement([])), null);
  const immersion = catalogue.experienceParSlug('immersion-producteur')!;
  assert.deepEqual(catalogue.evenementsDe(immersion, [evenement(['Atelier'])]), [], 'sur devis : jamais d’événement');
});

test('cartes de l’accueil : chaque expérience avec sa prochaine date Luma (faux serveur), sur devis sans date', async t => {
  t.mock.method(globalThis, 'fetch', async (entree: string | URL | Request, init?: RequestInit) =>
    simulation.listeSimulee(new Request(String(entree), { headers: new Headers(init?.headers) })));
  const cartes = await catalogue.cartesExperiences();
  assert.deepEqual(cartes.map(c => c.slug), contenu.EXPERIENCES.map(e => e.slug));
  const atelier = cartes.find(c => c.slug === 'atelier-cuisine-anti-gaspi')!;
  assert.equal(atelier.prochaineDate?.prix?.centimes, 7000);
  assert.ok(atelier.autresDates >= 1);
  assert.equal(cartes.find(c => c.slug === 'immersion-producteur')!.prochaineDate, null);
});

test('mosaïque entreprises : galeries des expériences, puis leurs couvertures, sans doublon, 4 photos', () => {
  const mosaique = catalogue.photosDesExperiences();
  assert.equal(mosaique.length, 4);
  assert.equal(new Set(mosaique.map(p => p.url)).size, 4);
  assert.deepEqual(mosaique[0], photos.GALERIES_EXPERIENCES['atelier-cuisine-anti-gaspi'][0]);
});

test('année d’une date à l’heure de Paris', async () => {
  const { anneeDe } = await import('../src/frontend/format');
  assert.equal(anneeDe('2026-12-31T23:30:00Z'), 2027); // 1er janvier, 0 h 30 à Paris
  assert.equal(anneeDe('2026-06-15T10:00:00Z'), 2026);
});

test('les liens « Demander un devis » passent le slug de l’expérience, celui qu’attend /contact', async () => {
  const fichiers = (await readdir('src/frontend', { recursive: true })).filter(f => f.endsWith('.tsx'));
  let liens = 0;
  for (const fichier of fichiers) {
    for (const [, valeur] of (await readFile(join('src/frontend', fichier), 'utf8')).matchAll(/\/contact\?experience=\$\{([^}]+)\}/g)) {
      liens += 1;
      assert.match(valeur, /slug$|^experience$/, `${fichier} : /contact?experience=\${${valeur}}`);
    }
  }
  assert.ok(liens >= 4);
});
