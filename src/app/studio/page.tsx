import type { Metadata } from 'next';
import { TEXTES } from '@/contenu/textes';
import Studio from '@/frontend/pages/studio';

export const metadata: Metadata = {
  title: 'Studio de production · Maison La recette',
  description: 'Production de podcasts sur-mesure et sponsoring pour les marques engagées.',
};

export default function StudioPage() {
  return <Studio textes={TEXTES.studio} />;
}
