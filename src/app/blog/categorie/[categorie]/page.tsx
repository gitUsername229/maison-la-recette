import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { pageBlog } from '@/backend/contenus/articles';
import { CATEGORIES_BLOG, estCategorie } from '@/backend/contenus/categories-blog';
import { metadonnees } from '@/backend/seo';
import Blog from '@/frontend/pages/blog';

type Props = { params: Promise<{ categorie: string }> };

// Une vraie page par catégorie (/blog/categorie/guides) : titre et description propres pour les moteurs de recherche.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorie } = await params;
  if (!estCategorie(categorie)) return {};
  const { libelle, description } = CATEGORIES_BLOG[categorie];
  return metadonnees({ titre: `${libelle} · Blog`, description, chemin: `/blog/categorie/${categorie}` });
}

export default async function CategoriePage({ params }: Props) {
  const { categorie } = await params;
  if (!estCategorie(categorie)) notFound();
  await connection();
  return <Blog {...await pageBlog(categorie)} />;
}
