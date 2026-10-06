import type { Metadata } from 'next';
import { connection } from 'next/server';
import { textesDePage } from '@/backend/contenus/textes-pages';
import Studio from '@/frontend/pages/studio';

export const metadata: Metadata = {
  title: 'Studio de production · Maison La recette',
  description: 'Production de podcasts sur-mesure et sponsoring pour les marques engagées.',
};

export default async function StudioPage() {
  await connection(); // textes modifiés dans l'admin, visibles aussitôt
  return <Studio textes={await textesDePage('studio')} />;
}
