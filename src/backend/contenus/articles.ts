import 'server-only';
import type { Prisma } from '@prisma/client';
import { experiencesAvecProchainesDates } from '@/backend/ateliers/catalogue';
import { prisma } from '@/backend/db/prisma';
import { appelDevis, libelleCategorie, listeCategories, type CategorieBlog } from './categories-blog';
import { textesDePage } from './textes-pages';

// Blog : articles classés par catégorie, liés à un épisode du podcast et à des expériences.

/** Articles publiés, les plus récents d'abord, avec le libellé de leur catégorie. */
export async function listerArticles({ categorie, limite }: { categorie?: CategorieBlog; limite?: number } = {}) {
  const where: Prisma.ArticleWhereInput = { publie: true, ...(categorie ? { categorie } : {}) };
  const articles = await prisma.article.findMany({ where, orderBy: { datePublication: 'desc' }, take: limite });
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
