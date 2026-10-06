import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listerAvis, listerPartenaires } from '@/backend/contenus/contenus';
import { imagesDePage } from '@/backend/contenus/images';
import { textesDePage } from '@/backend/contenus/textes-pages';
import APropos from '@/frontend/pages/a-propos';

export const metadata: Metadata = {
  title: 'À propos · Maison La recette',
  description: 'Notre histoire, nos engagements et notre mission autour de l’alimentation.',
};

export default async function AProposPage() {
  await connection(); // textes, partenaires, avis et photos gérés dans l'admin, lus à chaque requête
  const [textes, partenaires, avis, photos] = await Promise.all([textesDePage('a-propos'), listerPartenaires(), listerAvis(), imagesDePage('/a-propos')]);
  return <APropos textes={textes} partenaires={partenaires} avis={avis} photos={photos} />;
}
