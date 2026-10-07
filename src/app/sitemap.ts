import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { pagesDuSitemap } from '@/backend/seo';

// /sitemap.xml, recalculé à chaque demande : un article publié dans l'admin y apparaît aussitôt.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  return pagesDuSitemap();
}
