import type { MetadataRoute } from 'next';
import { pagesDuSitemap } from '@/backend/seo';

// /sitemap.xml : pages publiques, expériences et articles (fichiers de src/contenu/).
export default function sitemap(): MetadataRoute.Sitemap {
  return pagesDuSitemap();
}
