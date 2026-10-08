import 'server-only';
import type { Metadata, MetadataRoute } from 'next';
import { articlesPublies } from '@/backend/contenus/blog';
import { estCategorie } from '@/backend/contenus/categories-blog';
import { NOM_DU_SITE, urlDuSite } from '@/backend/site';
import { EXPERIENCES } from '@/contenu/experiences';

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

/** Pages techniques ou de passage : exclues du sitemap et interdites aux robots. */
export const CHEMINS_PRIVES = ['/luma-simule', '/tableau-de-bord', '/api/'];

/**
 * Sitemap : pages publiques, expériences, articles publiés et les catégories qui en ont
 * (une catégorie vide n'est pas proposée aux moteurs de recherche).
 */
export function pagesDuSitemap(): MetadataRoute.Sitemap {
  const articles = articlesPublies();
  const categories = [...new Set(articles.map(a => a.categorie))].filter(estCategorie);
  return [
    ...PAGES_PUBLIQUES.map(chemin => ({ url: urlDuSite(chemin) })),
    ...EXPERIENCES.map(e => ({ url: urlDuSite(`/experiences/${e.slug}`) })),
    ...categories.map(categorie => ({ url: urlDuSite(`/blog/categorie/${categorie}`) })),
    ...articles.map(a => ({ url: urlDuSite(`/blog/${a.slug}`), lastModified: a.datePublication })),
  ];
}
