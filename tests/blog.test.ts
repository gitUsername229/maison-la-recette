import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let blog: typeof import('../src/backend/contenus/blog');
let seo: typeof import('../src/backend/seo');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  blog = await import('../src/backend/contenus/blog');
  seo = await import('../src/backend/seo');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const enTete = (lignes: string) => `---\n${lignes}\n---\n\nTexte de l’article.\n`;

test('articles du dossier src/contenu/blog : publiés, les plus récents d’abord, catégorie lisible', () => {
  const articles = blog.articlesPublies();
  assert.ok(articles.length >= 3);
  assert.deepEqual(articles.map(a => a.datePublication.getTime()), articles.map(a => a.datePublication.getTime()).toSorted((a, b) => b - a));
  const coulisses = articles.find(a => a.slug === 'dans-les-coulisses-d-un-episode')!;
  assert.equal(coulisses.categorieLibelle, 'Coulisses du podcast');
  assert.match(coulisses.episode ?? '', /Pédron/);
  assert.ok(blog.articlesPublies('entreprises').every(a => a.categorie === 'entreprises'));
});

test('en-tête : titre (deux-points compris), expériences en liste, brouillon, Markdown gardé', () => {
  const article = blog.lireArticle('mon-article', enTete([
    'titre: Bien manger : par où commencer ?', 'extrait: Un résumé', 'categorie: guides', 'date: 2026-05-02',
    'experiences: atelier-cuisine-anti-gaspi, immersion-producteur', 'publie: non',
  ].join('\n')));
  assert.equal(article.titre, 'Bien manger : par où commencer ?');
  assert.deepEqual(article.experiences, ['atelier-cuisine-anti-gaspi', 'immersion-producteur']);
  assert.equal(article.publie, false);
  assert.equal(article.datePublication.toISOString().slice(0, 10), '2026-05-02');
  assert.equal(article.contenu, 'Texte de l’article.');
});

test('en-tête mal rempli : message clair', () => {
  assert.throws(() => blog.lireArticle('a', 'Pas d’en-tête'), /en-tête manquant/);
  assert.throws(() => blog.lireArticle('a', enTete('titre: T\nextrait: E\ncategorie: recettes\ndate: 2026-05-02')), /categorie : catégorie inconnue/);
  assert.throws(() => blog.lireArticle('a', enTete('titre: T\nextrait: E\ncategorie: guides\ndate: 02/05/2026')), /date : date attendue/);
});

test('un fichier mal rempli est ignoré (et signalé) sans faire tomber le blog', async t => {
  const dossier = await mkdtemp(join(tmpdir(), 'maison-blog-'));
  t.after(() => rm(dossier, { recursive: true, force: true }));
  await writeFile(join(dossier, 'bon.md'), enTete('titre: Bon\nextrait: E\ncategorie: guides\ndate: 2026-05-02'));
  await writeFile(join(dossier, 'casse.md'), enTete('titre: Cassé'));
  await writeFile(join(dossier, 'Majuscules.md'), enTete('titre: T\nextrait: E\ncategorie: guides\ndate: 2026-05-02'));
  const erreurs = t.mock.method(console, 'error', () => undefined);
  assert.deepEqual(blog.tousLesArticles(dossier).map(a => a.slug), ['bon']);
  assert.equal(erreurs.mock.callCount(), 2);
});

test('SEO : articles publiés et leurs catégories dans le sitemap ; robots.txt', async () => {
  const urls = (await seo.pagesDuSitemap()).map(p => p.url);
  for (const article of blog.articlesPublies()) assert.ok(urls.includes(`http://localhost:3000/blog/${article.slug}`), article.slug);
  assert.ok(urls.includes('http://localhost:3000/blog/categorie/coulisses-podcast'));
  assert.ok(seo.CHEMINS_PRIVES.includes('/api/'));
});
