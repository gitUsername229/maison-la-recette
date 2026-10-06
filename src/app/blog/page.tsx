import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listerArticles } from '@/backend/contenus/contenus';
import Blog from '@/frontend/pages/blog';

export const metadata: Metadata = {
  title: 'Blog & Récits · Maison La recette',
  description: 'Articles, astuces de cuisine durable et actualités.',
};

export default async function BlogPage() {
  await connection(); // articles publiés depuis l'admin, visibles aussitôt
  return <Blog articles={await listerArticles()} />;
}
