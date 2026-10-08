import 'server-only';
import { experiencesAvecProchainesDates } from '@/backend/ateliers/catalogue';
import { prisma } from '@/backend/db/prisma';
import { TEXTES } from '@/contenu/textes';
import { articlesPublies, tousLesArticles } from './blog';
import { appelDevis, listeCategories, type CategorieBlog } from './categories-blog';

// Blog : articles en Markdown (src/contenu/blog/), classés par catégorie, liés à un épisode et à des expériences.

/** Ce qu'affiche la liste du blog : tous les articles (/blog) ou ceux d'une catégorie (/blog/categorie/<clé>). */
export function pageBlog(categorie?: CategorieBlog) {
  const categories = listeCategories();
  return { textes: TEXTES.blog, articles: articlesPublies(categorie), categories, categorieActive: categories.find(c => c.valeur === categorie) };
}

/**
 * Article publié avec ce qui le prolonge : l'épisode lié (retrouvé par son titre) et les expériences liées, avec
 * leurs prochaines dates. Null pour un article non publié ou une adresse inconnue.
 */
export async function articlePublie(slug: string) {
  const article = tousLesArticles().find(a => a.slug === slug && a.publie);
  if (!article) return null;
  const [episode, experiences] = await Promise.all([
    article.episode ? prisma.episode.findFirst({ where: { titre: article.episode } }) : null,
    experiencesAvecProchainesDates(article.experiences),
  ]);
  return { ...article, appelDevis: appelDevis(article.categorie), episode, experiences };
}
