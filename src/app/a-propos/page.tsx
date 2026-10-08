import type { Metadata } from 'next';
import { AVIS } from '@/contenu/avis';
import { PARTENAIRES } from '@/contenu/partenaires';
import { GALERIE_A_PROPOS } from '@/contenu/photos';
import { TEXTES } from '@/contenu/textes';
import APropos from '@/frontend/pages/a-propos';

export const metadata: Metadata = {
  title: 'À propos · Maison La recette',
  description: 'Notre histoire, nos engagements et notre mission autour de l’alimentation.',
};

export default function AProposPage() {
  return <APropos textes={TEXTES['a-propos']} partenaires={PARTENAIRES} avis={AVIS} photos={GALERIE_A_PROPOS} />;
}
