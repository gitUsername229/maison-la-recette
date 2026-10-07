import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let catalogue: typeof import('../src/backend/ateliers/catalogue');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  catalogue = await import('../src/backend/ateliers/catalogue');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const JOUR = 86_400_000;
const experience = (slug: string, autres: Record<string, unknown> = {}) => prisma.experience.create({
  data: { slug, type: 'atelier', titre: slug, accroche: 'A', description: 'D', dureeMin: 120, prixCents: 4500, capaciteMax: 10, image: '', imageAlt: '', ...autres },
});
const session = (experienceId: number, jours: number, autres: Record<string, unknown> = {}) => {
  const debut = new Date(Date.now() + jours * JOUR);
  return prisma.session.create({ data: { experienceId, dateDebut: debut, dateFin: new Date(debut.getTime() + 7_200_000), lieu: `J+${jours}`, placesTotal: 8, ...autres } });
};

test('cartes : prochaine date ouverte avec des places, autres dates comptées, « sur devis » sinon', async () => {
  const atelier = await experience('carte-atelier');
  await session(atelier.id, -1);                         // passée
  await session(atelier.id, 2, { placesPrises: 8 });     // complète
  await session(atelier.id, 3, { statut: 'complete' });  // fermée
  await session(atelier.id, 5, { placesPrises: 3 });     // prochaine : 5 places restantes
  await session(atelier.id, 9);
  await session(atelier.id, 12);
  await experience('carte-sans-date');
  const surDevis = await experience('carte-sur-devis', { type: 'immersion', reservableEnLigne: false });
  await session(surDevis.id, 4);
  await experience('carte-masquee', { actif: false });

  const cartes = await catalogue.cartesExperiences();
  const carte = (slug: string) => cartes.find(c => c.slug === slug);
  assert.equal(carte('carte-atelier')?.prochaineDate?.lieu, 'J+5');
  assert.equal(carte('carte-atelier')?.prochaineDate?.placesRestantes, 5);
  assert.equal(carte('carte-atelier')?.autresDates, 2);
  assert.deepEqual([carte('carte-sans-date')?.prochaineDate, carte('carte-sans-date')?.autresDates], [null, 0]);
  assert.deepEqual([carte('carte-sur-devis')?.prochaineDate, carte('carte-sur-devis')?.autresDates], [null, 0]);
  assert.equal(carte('carte-masquee'), undefined);
});

test('l’adresse « entreprises » est réservée à l’onglet Entreprises', async () => {
  const corps = { slug: 'entreprises', type: 'atelier', titre: 'T', accroche: 'A', description: 'D', dureeMin: 60, prixCents: 4500, capaciteMax: 8, image: '', imageAlt: '' };
  const reponse = await catalogue.createExperience(requete('/api/experiences', { methode: 'POST', corps, entetes: { 'x-admin-key': 'local-test-admin' } }));
  assert.equal(reponse.status, 400);
  assert.deepEqual((await reponse.json() as { details: { champ: string }[] }).details.map(d => d.champ), ['slug']);
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
  assert.ok(liens >= 5);
});

