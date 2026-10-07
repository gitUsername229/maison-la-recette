import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let demo: typeof import('../prisma/images-demo');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  demo = await import('../prisma/images-demo');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

test('chaque photo de démonstration est dans le dépôt et créditée (licence Unsplash)', () => {
  const credits = readFileSync('public/images/demo/CREDITS.md', 'utf8');
  assert.match(credits, /\[licence Unsplash\]\(https:\/\/unsplash\.com\/license\)/);
  for (const nom of demo.NOMS_PHOTOS_DEMO) {
    assert.ok(existsSync(`public/images/demo/${nom}.jpg`), `${nom}.jpg manquante`);
    assert.match(credits, new RegExp(`\\| \`${nom}\\.jpg\` \\| .+ \\| \\[.+\\]\\(https://unsplash\\.com/@.+\\) \\| \\[.+\\]\\(https://unsplash\\.com/photos/.+\\) \\|`), `${nom}.jpg non créditée`);
  }
});

test('seed : photos posées seulement sur les couvertures vides et les pages sans galerie', async () => {
  const experience = (slug: string, image = '') => prisma.experience.create({
    data: { slug, type: 'atelier', titre: slug, accroche: 'A', description: 'D', dureeMin: 60, prixCents: 4500, capaciteMax: 10, image, imageAlt: image ? 'Photo de Julie' : '' },
  });
  await experience('atelier-cuisine-anti-gaspi');
  await experience('good-tour-marche-producteurs', '/images/uploads/photo-de-julie.jpg');
  await prisma.image.create({ data: { url: '/images/uploads/galerie.jpg', alt: 'Choisie par Julie', page: '/a-propos' } });

  const premier = await demo.poserPhotosDemo(prisma);
  assert.equal(premier.couvertures, 1);
  const atelier = await prisma.experience.findUniqueOrThrow({ where: { slug: 'atelier-cuisine-anti-gaspi' } });
  assert.ok(atelier.image.startsWith('/images/demo/') && atelier.imageAlt.length > 0);
  assert.equal((await prisma.experience.findUniqueOrThrow({ where: { slug: 'good-tour-marche-producteurs' } })).image, '/images/uploads/photo-de-julie.jpg');
  assert.deepEqual((await prisma.image.findMany({ where: { page: '/a-propos' } })).map(i => i.alt), ['Choisie par Julie']);
  assert.ok((await prisma.image.findMany({ where: { page: '/' }, orderBy: { ordre: 'asc' } }))[0].url.startsWith('/images/demo/'));

  assert.deepEqual(await demo.poserPhotosDemo(prisma), { couvertures: 0, galeries: 0 });
});
