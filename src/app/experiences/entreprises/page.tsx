import { connection } from 'next/server';
import { photosDesExperiences } from '@/backend/ateliers/catalogue';
import { metadonnees } from '@/backend/seo';
import { AVIS } from '@/contenu/avis';
import { TEXTES } from '@/contenu/textes';
import ExperiencesEntreprises from '@/frontend/pages/experiences-entreprises';

export const metadata = metadonnees({
  titre: 'Expériences pour les entreprises',
  description: 'Ateliers, food tours et immersions sur mesure pour vos équipes : un appel, puis une proposition sous 48 h.',
  chemin: '/experiences/entreprises',
});

export default async function Page() {
  await connection(); // couvertures des expériences lues en base
  return <ExperiencesEntreprises textes={TEXTES.experiences} photos={await photosDesExperiences()} avis={AVIS} />;
}
