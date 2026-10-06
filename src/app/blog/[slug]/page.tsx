import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { articlePublie } from '@/backend/contenus/contenus';
import Article from '@/frontend/pages/article';

type Props = { params: Promise<{ slug: string }> };

const charger = cache((slug: string) => articlePublie(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await charger((await params).slug);
  return article ? { title: `${article.titre} · Maison La recette`, description: article.extrait } : {};
}

export default async function Page({ params }: Props) {
  await connection();
  const article = await charger((await params).slug);
  if (!article) notFound(); // brouillon ou adresse inconnue
  return <Article article={article} />;
}
