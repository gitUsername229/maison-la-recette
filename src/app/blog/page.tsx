import { connection } from 'next/server';
import { pageBlog } from '@/backend/contenus/articles';
import { metadonnees } from '@/backend/seo';
import Blog from '@/frontend/pages/blog';

export const metadata = metadonnees({
  titre: 'Blog & Récits',
  description: 'Retours d’expérience, coulisses du podcast, guides pratiques et idées pour les entreprises.',
  chemin: '/blog',
});

export default async function BlogPage() {
  await connection(); // articles et textes gérés dans l'admin, visibles aussitôt
  return <Blog {...await pageBlog()} />;
}
