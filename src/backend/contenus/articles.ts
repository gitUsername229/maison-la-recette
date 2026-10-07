import 'server-only';
import type { Prisma } from '@prisma/client';
import { experiencesAvecProchainesDates } from '@/backend/ateliers/catalogue';
import { estAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json, type RouteContext } from '@/backend/http';
import { appelDevis, CLES_CATEGORIES, estCategorie, libelleCategorie, listeCategories, type CategorieBlog } from './categories-blog';
import { entierParametre, routesRessource } from './crud';
import { supprimerFichierOrphelin } from './images';
import { textesDePage } from './textes-pages';
import { articleSchemas } from './validation';

// Blog : articles classés par catégorie, liés à un épisode du podcast et à des expériences.

type Filtre = { tout?: boolean; categorie?: CategorieBlog };

const conditions = ({ tout = false, categorie }: Filtre): Prisma.ArticleWhereInput => ({
  ...(tout ? {} : { publie: true }),
  ...(categorie ? { categorie } : {}),
});

/** Articles publiés (ou tous avec `tout`), les plus récents d'abord, avec le libellé de leur catégorie. */
export async function listerArticles({ tout, categorie, limite }: Filtre & { limite?: number } = {}) {
  const articles = await prisma.article.findMany({ where: conditions({ tout, categorie }), orderBy: { datePublication: 'desc' }, take: limite });
  return articles.map(article => ({ ...article, categorieLibelle: libelleCategorie(article.categorie) }));
}

/** Ce qu'affiche la liste du blog : tous les articles (/blog) ou ceux d'une catégorie (/blog/categorie/<clé>). */
export async function pageBlog(categorie?: CategorieBlog) {
  const [textes, articles] = await Promise.all([textesDePage('blog'), listerArticles({ categorie })]);
  const categories = listeCategories();
  return { textes, articles, categories, categorieActive: categories.find(c => c.valeur === categorie) };
}

/**
 * Article publié avec ce qui le prolonge : l'épisode lié et les expériences visibles, avec leurs prochaines dates
 * ouvertes (lues dans les sessions). Null pour un brouillon ou une adresse inconnue.
 */
export async function articlePublie(slug: string) {
  const article = await prisma.article.findUnique({ where: { slug }, include: { episode: true, experiences: { select: { id: true } } } });
  if (!article?.publie) return null;
  const experiences = await experiencesAvecProchainesDates(article.experiences.map(e => e.id));
  return { ...article, categorieLibelle: libelleCategorie(article.categorie), appelDevis: appelDevis(article.categorie), experiences };
}

/** ?categorie=guides ; absente → toutes ; inconnue → 400. */
function categorieDemandee(params: URLSearchParams) {
  const categorie = params.get('categorie');
  if (categorie === null) return undefined;
  if (!estCategorie(categorie)) throw new ApiError(400, `Catégorie inconnue : ${CLES_CATEGORIES.join(', ')}.`);
  return categorie;
}

/** Vue admin : brouillons compris, avec le titre de l'épisode lié et les expériences liées (cases à cocher). */
async function articlesPourAdmin(categorie?: CategorieBlog) {
  const articles = await prisma.article.findMany({
    where: conditions({ tout: true, categorie }),
    orderBy: { datePublication: 'desc' },
    include: { episode: { select: { titre: true } }, experiences: { select: { id: true } } },
  });
  return articles.map(({ experiences, ...article }) => ({ ...article, experienceIds: experiences.map(e => e.id) }));
}

/** L'épisode et les expériences liés doivent exister (sinon la page de l'admin n'est plus à jour). */
async function verifierLiens({ episodeId, experienceIds }: { episodeId?: number | null; experienceIds?: number[] }) {
  if (episodeId && !await prisma.episode.count({ where: { id: episodeId } })) {
    throw new ApiError(400, 'Cet épisode n’existe plus : rechargez la page.', { champ: 'episodeId' });
  }
  if (experienceIds?.length && await prisma.experience.count({ where: { id: { in: experienceIds } } }) !== experienceIds.length) {
    throw new ApiError(400, 'Une des expériences n’existe plus : rechargez la page.', { champ: 'experienceIds' });
  }
}

const relies = (ids: number[]) => ids.map(id => ({ id }));

export const articles = routesRessource({
  schemas: articleSchemas,
  lister: (admin, params) => {
    const categorie = categorieDemandee(params);
    return admin ? articlesPourAdmin(categorie) : listerArticles({ categorie, limite: entierParametre(params, 'limit', 50) });
  },
  creer: async ({ experienceIds, ...data }) => {
    await verifierLiens({ episodeId: data.episodeId, experienceIds });
    return prisma.article.create({ data: { ...data, experiences: { connect: relies(experienceIds) } } });
  },
  modifier: async (id, { experienceIds, ...data }) => {
    await verifierLiens({ episodeId: data.episodeId, experienceIds });
    const avant = await prisma.article.findUniqueOrThrow({ where: { id }, select: { image: true } });
    // `set` remplace les expériences liées par celles cochées.
    const article = await prisma.article.update({ where: { id }, data: { ...data, ...(experienceIds && { experiences: { set: relies(experienceIds) } }) } });
    if (article.image !== avant.image) await supprimerFichierOrphelin(avant.image);
    return article;
  },
  supprimer: async id => supprimerFichierOrphelin((await prisma.article.delete({ where: { id } })).image),
});

/** GET /api/articles/[slug] : un article publié (ou un brouillon pour l'admin). */
export const articleParSlug = endpoint(async (request: Request, context: RouteContext) => {
  const article = await prisma.article.findUnique({ where: { slug: (await context.params).id } });
  if (!article || (!article.publie && !await estAdmin(request))) throw new ApiError(404, 'Article introuvable');
  return json({ ...article, categorieLibelle: libelleCategorie(article.categorie) });
});

/** GET /api/blog/categories : les catégories dans l'ordre (listes et filtre de l'admin). */
export const categoriesBlog = endpoint(async () => json(listeCategories()));
