import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listerAvis, listerPartenaires } from '@/backend/contenus/contenus';
import { imagesDePage } from '@/backend/contenus/images';
import APropos from '@/frontend/pages/a-propos';

export const metadata: Metadata = {
  title: 'À propos · Maison La recette',
  description: 'Notre histoire, nos engagements et notre mission autour de l’alimentation.',
};

export default async function AProposPage() {
  await connection(); // partenaires, avis et photos gérés dans l'admin, lus à chaque requête
  const [partenaires, avis, photos] = await Promise.all([listerPartenaires(), listerAvis(), imagesDePage('/a-propos')]);
  return <APropos partenaires={partenaires} avis={avis} photos={photos} />;
}
