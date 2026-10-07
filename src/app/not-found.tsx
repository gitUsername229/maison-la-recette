import type { Metadata } from 'next';
import Introuvable from '@/frontend/pages/introuvable';

// Adresses inconnues et notFound() (article, expérience, catégorie) : page 404 du thème, dans le layout du site.
export const metadata: Metadata = { title: 'Page introuvable · Maison La recette', robots: { index: false } };

export default function NotFound() {
  return <Introuvable />;
}
