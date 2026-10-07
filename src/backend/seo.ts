import 'server-only';
import type { Metadata, MetadataRoute } from 'next';
import { estCategorie } from '@/backend/contenus/categories-blog';
import { prisma } from '@/backend/db/prisma';
import { NOM_DU_SITE, urlDuSite } from '@/backend/site';

// Référencement : balises des pages publiques, sitemap et robots.txt.

type PagePublique = {
  titre: string;
  description: string;
  chemin: string;                                        // adresse canonique, ex : /blog/mon-article
  image?: { url: string; alt: string };                  // aperçu de partage (couverture)
  article?: { publication: Date; categorie: string };    // page d'article
};

/** Titre, description, adresse canonique et aperçus de partage (Open Graph, X) d'une page publique. */
export function metadonnees({ titre, description, chemin, image, article }: PagePublique): Metadata {
  const images = image?.url ? [{ url: image.url, alt: image.alt }] : undefined;
  const commun = { title: titre, description, url: chemin, siteName: NOM_DU_SITE, locale: 'fr_FR', images };
  return {
    title: `${titre} · ${NOM_DU_SITE}`,
    description,
    alternates: { canonical: chemin },
    openGraph: article
      ? { ...commun, type: 'article', publishedTime: article.publication.toISOString(), section: article.categorie }
      : { ...commun, type: 'website' },
    twitter: { card: images ? 'summary_large_image' : 'summary', title: titre, description, images: images?.map(i => i.url) },
  };
}

const PAGES_PUBLIQUES = ['/', '/experiences', '/experiences/entreprises', '/podcast', '/blog', '/a-propos', '/studio', '/contact', '/mentions-legales', '/confidentialite'];

/**
 * Pages réservées à l'administration (connexion comprise), techniques ou de passage : exclues du sitemap
 * et interdites aux robots. Ce n'est pas une protection : chaque page et route admin vérifie l'accès.
 */
export const CHEMINS_PRIVES = ['/admin', '/reservation', '/acces-refuse', '/api/'];

/**
 * Sitemap : pages publiques, expériences visibles, articles publiés et les catégories qui en ont
 * (une catégorie vide n'est pas proposée aux moteurs de recherche).
 */
export async function pagesDuSitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, experiences] = await Promise.all([
    prisma.article.findMany({ where: { publie: true }, select: { slug: true, categorie: true, datePublication: true }, orderBy: { datePublication: 'desc' } }),
    prisma.experience.findMany({ where: { actif: true }, select: { slug: true }, orderBy: { id: 'asc' } }),
  ]);
  const categories = [...new Set(articles.map(a => a.categorie))].filter(estCategorie);
  return [
    ...PAGES_PUBLIQUES.map(chemin => ({ url: urlDuSite(chemin) })),
    ...experiences.map(e => ({ url: urlDuSite(`/experiences/${e.slug}`) })),
    ...categories.map(categorie => ({ url: urlDuSite(`/blog/categorie/${categorie}`) })),
    ...articles.map(a => ({ url: urlDuSite(`/blog/${a.slug}`), lastModified: a.datePublication })),
  ];
}
