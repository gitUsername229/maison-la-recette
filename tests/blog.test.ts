import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let blog: typeof import('../src/backend/contenus/articles');
let seo: typeof import('../src/backend/seo');
let demo: typeof import('../prisma/articles-demo');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  blog = await import('../src/backend/contenus/articles');
  seo = await import('../src/backend/seo');
  demo = await import('../prisma/articles-demo');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const admin = (chemin: string, methode = 'GET', corps?: unknown) => requete(chemin, { methode, corps, entetes: { 'x-admin-key': 'local-test-admin' } });
const avecId = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
type Erreur = { error: string; details?: { champ: string; message: string }[] };
type ArticleApi = { id: number; slug: string; categorie: string; categorieLibelle?: string; episodeId: number | null; experienceIds?: number[]; episode?: { titre: string } | null };

const JOUR = 86_400_000;
const article = (slug: string, autres: Record<string, unknown> = {}) =>
  ({ slug, titre: `Titre ${slug}`, extrait: 'Extrait', contenu: 'Contenu', image: '', imageAlt: '', publie: true, ...autres });
const creer = async (corps: unknown) => {
  const reponse = await blog.articles.creer(admin('/api/articles', 'POST', corps));
  return { statut: reponse.status, corps: await reponse.json() as ArticleApi & Erreur };
};
const experience = (slug: string, autres: Record<string, unknown> = {}) => prisma.experience.create({
  data: { slug, type: 'atelier', titre: `Expérience ${slug}`, accroche: 'Accroche', description: 'D', dureeMin: 120, prixCents: 4500, capaciteMax: 10, image: '', imageAlt: '', ...autres },
});
const episode = (numero: number, type = 'complet') => prisma.episode.create({
  data: { numero, titre: `Épisode ${numero}`, description: 'D', type, datePublication: new Date(Date.now() - numero * JOUR), dureeMin: 30, image: '', embedUrl: `https://player.ausha.co/?podcastId=${numero}` },
});

test('catégories : liste pour l’admin, filtre de la liste, catégorie inconnue refusée', async () => {
  const categories = await (await blog.categoriesBlog()).json() as { valeur: string; libelle: string }[];
  assert.deepEqual(categories.map(c => c.valeur), ['retours-experience', 'coulisses-podcast', 'guides', 'entreprises']);
  assert.equal(categories[3].libelle, 'Pour les entreprises');

  await creer(article('guide-1', { categorie: 'guides' }));
  await creer(article('equipe-1', { categorie: 'entreprises' }));
  await creer(article('brouillon-1', { categorie: 'guides', publie: false }));
  const guides = await (await blog.articles.lister(requete('/api/articles?categorie=guides'))).json() as ArticleApi[];
  assert.deepEqual(guides.map(a => [a.slug, a.categorieLibelle]), [['guide-1', 'Guides pratiques']]); // brouillon invisible
  assert.equal((await blog.articles.lister(requete('/api/articles?categorie=recettes'))).status, 400);
  assert.deepEqual((await blog.listerArticles({ categorie: 'entreprises' })).map(a => a.slug), ['equipe-1']);
});

test('création : catégorie « guides » par défaut, liens vérifiés, adresse « categorie » réservée', async () => {
  assert.equal((await creer(article('sans-categorie'))).corps.categorie, 'guides');

  const mauvaiseCategorie = await creer(article('mauvaise', { categorie: 'recettes' }));
  assert.equal(mauvaiseCategorie.statut, 400);
  assert.deepEqual(mauvaiseCategorie.corps.details?.map(d => d.champ), ['categorie']);
  assert.deepEqual((await creer(article('categorie'))).corps.details?.map(d => d.champ), ['slug']);
  assert.deepEqual((await creer(article('episode-fantome', { episodeId: 9999 }))).corps.details, [{ champ: 'episodeId', message: 'Cet épisode n’existe plus : rechargez la page.' }]);
  assert.deepEqual((await creer(article('experience-fantome', { experienceIds: [9999] }))).corps.details?.map(d => d.champ), ['experienceIds']);
});

test('liens : les expériences cochées remplacent les anciennes ; l’épisode supprimé est délié', async () => {
  const [a, b] = [await experience('liens-a'), await experience('liens-b')];
  const ep = await episode(1);
  const { corps: cree } = await creer(article('avec-liens', { episodeId: ep.id, experienceIds: [a.id, b.id, a.id] }));
  const liste = async () => (await (await blog.articles.lister(admin('/api/articles'))).json() as ArticleApi[]).find(x => x.id === cree.id)!;
  assert.deepEqual((await liste()).experienceIds, [a.id, b.id]); // doublon ignoré
  assert.equal((await liste()).episode?.titre, 'Épisode 1');

  assert.equal((await blog.articles.modifier(admin(`/api/articles/${cree.id}`, 'PUT', { experienceIds: [b.id] }), avecId(cree.id))).status, 200);
  assert.deepEqual((await liste()).experienceIds, [b.id]);
  assert.equal((await blog.articles.modifier(admin(`/api/articles/${cree.id}`, 'PUT', { titre: 'Nouveau titre' }), avecId(cree.id))).status, 200);
  assert.deepEqual((await liste()).experienceIds, [b.id]); // champ absent : liens inchangés

  await prisma.episode.delete({ where: { id: ep.id } });
  assert.equal((await liste()).episodeId, null);
});

test('article publié : épisode, expériences visibles et seulement leurs prochaines dates ouvertes avec de la place', async () => {
  const visible = await experience('dates-visible');
  const masquee = await experience('dates-masquee', { actif: false });
  const dans = (jours: number) => new Date(Date.now() + jours * JOUR);
  const session = (jours: number, autres: Record<string, unknown> = {}) => prisma.session.create({
    data: { experienceId: visible.id, dateDebut: dans(jours), dateFin: new Date(dans(jours).getTime() + 7_200_000), lieu: `Lieu J+${jours}`, placesTotal: 6, ...autres },
  });
  await session(-2);                                        // passée
  await session(5, { prixCents: 3900 });                    // ouverte, prix spécifique
  await session(6, { statut: 'complete' });                 // fermée
  await session(7, { placesPrises: 6 });                    // complète
  await session(8, { statut: 'annulee' });                  // annulée
  await session(9);                                         // ouverte, prix de l'expérience
  const ep = await episode(2);

  const { corps } = await creer(article('pour-equipe', { categorie: 'entreprises', episodeId: ep.id, experienceIds: [visible.id, masquee.id] }));
  const lu = await blog.articlePublie('pour-equipe');
  assert.ok(lu);
  assert.equal(lu.appelDevis, true);
  assert.equal(lu.categorieLibelle, 'Pour les entreprises');
  assert.equal(lu.episode?.titre, 'Épisode 2');
  assert.deepEqual(lu.experiences.map(e => e.slug), ['dates-visible']);
  assert.deepEqual(lu.experiences[0].prochainesDates.map(s => [s.lieu, s.prixCents]), [['Lieu J+5', 3900], ['Lieu J+9', 4500]]);

  assert.equal((await blog.articlePublie('guide-1'))?.appelDevis, false);
  await blog.articles.modifier(admin(`/api/articles/${corps.id}`, 'PUT', { publie: false }), avecId(corps.id));
  assert.equal(await blog.articlePublie('pour-equipe'), null); // brouillon
});

test('SEO : balises d’un article ; sitemap sans brouillon ni page privée ; robots.txt', async () => {
  const balises = seo.metadonnees({
    titre: 'Mon article', description: 'Extrait', chemin: '/blog/mon-article',
    image: { url: '/images/uploads/couverture.jpg', alt: 'Couverture' }, article: { publication: new Date('2026-10-01T08:00:00Z'), categorie: 'Guides pratiques' },
  });
  assert.equal(balises.title, 'Mon article · Maison La recette');
  assert.equal(balises.description, 'Extrait');
  assert.deepEqual(balises.alternates, { canonical: '/blog/mon-article' });
  assert.deepEqual(balises.openGraph, {
    title: 'Mon article', description: 'Extrait', url: '/blog/mon-article', siteName: 'Maison La recette', locale: 'fr_FR',
    images: [{ url: '/images/uploads/couverture.jpg', alt: 'Couverture' }],
    type: 'article', publishedTime: '2026-10-01T08:00:00.000Z', section: 'Guides pratiques',
  });
  assert.deepEqual(balises.twitter, { card: 'summary_large_image', title: 'Mon article', description: 'Extrait', images: ['/images/uploads/couverture.jpg'] });
  assert.equal(seo.metadonnees({ titre: 'Blog', description: 'D', chemin: '/blog' }).openGraph?.images, undefined); // sans couverture

  const urls = (await seo.pagesDuSitemap()).map(p => new URL(p.url).pathname);
  assert.ok(['/', '/blog', '/experiences', '/podcast', '/blog/guide-1', '/experiences/dates-visible', '/blog/categorie/guides'].every(u => urls.includes(u)));
  assert.ok(!urls.includes('/blog/brouillon-1') && !urls.includes('/experiences/dates-masquee'));
  assert.ok(!urls.includes('/blog/categorie/coulisses-podcast')); // catégorie sans article publié
  assert.ok(urls.every(u => !seo.CHEMINS_PRIVES.some(prive => u.startsWith(prive))));
  const { default: robots } = await import('../src/app/robots');
  const { rules, sitemap } = robots();
  assert.deepEqual(rules, { userAgent: '*', allow: '/', disallow: seo.CHEMINS_PRIVES });
  assert.ok(['/admin', '/api/'].every(prive => seo.CHEMINS_PRIVES.includes(prive))); // /admin couvre /admin/connexion
  assert.equal(sitemap, 'http://localhost:3000/sitemap.xml');
});

test('seed : trois articles de démonstration publiés, un par catégorie principale, jamais recréés', async () => {
  await experience('atelier-cuisine-anti-gaspi');
  await experience('immersion-producteur', { type: 'immersion', reservableEnLigne: false });
  const recent = await episode(0);
  await episode(3, 'extrait');

  assert.deepEqual(await demo.creerArticlesDemo(prisma), { crees: 3, sansEpisode: false });
  const articles = await prisma.article.findMany({ where: { contenu: { contains: 'Contenu de démonstration à remplacer' } }, include: { experiences: true }, orderBy: { categorie: 'asc' } });
  assert.deepEqual(articles.map(a => a.categorie), ['coulisses-podcast', 'entreprises', 'retours-experience']);
  assert.ok(articles.every(a => a.publie && a.extrait.startsWith('Contenu de démonstration à remplacer')));
  assert.equal(articles[0].episodeId, recent.id); // dernier épisode complet
  assert.deepEqual(articles[1].experiences.map(e => e.slug).sort(), ['atelier-cuisine-anti-gaspi', 'immersion-producteur']);

  await prisma.article.update({ where: { id: articles[0].id }, data: { titre: 'Titre de Julie' } });
  assert.deepEqual(await demo.creerArticlesDemo(prisma), { crees: 0, sansEpisode: false });
  assert.equal((await prisma.article.findUniqueOrThrow({ where: { id: articles[0].id } })).titre, 'Titre de Julie');
});
