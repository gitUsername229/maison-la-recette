import type { MetadataRoute } from 'next';
import { CHEMINS_PRIVES } from '@/backend/seo';
import { urlDuSite } from '@/backend/site';

// /robots.txt : tout le site public est ouvert aux moteurs de recherche, sauf les pages privées.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: CHEMINS_PRIVES },
    sitemap: urlDuSite('/sitemap.xml'),
  };
}
