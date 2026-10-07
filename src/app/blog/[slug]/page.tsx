import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { articlePublie } from '@/backend/contenus/articles';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { metadonnees } from '@/backend/seo';
import Article from '@/frontend/pages/article';

type Props = { params: Promise<{ slug: string }> };

const charger = cache((slug: string) => articlePublie(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await charger((await params).slug);
  if (!article) return {};
  return metadonnees({
    titre: article.titre,
    description: article.extrait,
    chemin: `/blog/${article.slug}`,
    image: { url: article.image, alt: article.imageAlt },
    article: { publication: article.datePublication, categorie: article.categorieLibelle },
  });
}

export default async function Page({ params }: Props) {
  await connection(); // prochaines dates et places restantes lues à chaque requête
  const [article, textes] = await Promise.all([charger((await params).slug), textesDePage('blog')]);
  if (!article) notFound(); // brouillon ou adresse inconnue
  return <Article article={article} textes={textes} />;
}
