import { connection } from 'next/server';
import { cartesExperiences } from '@/backend/ateliers/catalogue';
import { listerAvis } from '@/backend/contenus/contenus';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { metadonnees } from '@/backend/seo';
import ExperiencesEntreprises from '@/frontend/pages/experiences-entreprises';

export const metadata = metadonnees({
  titre: 'Expériences pour les entreprises',
  description: 'Ateliers, good tours et immersions sur mesure pour vos équipes : un appel, puis une proposition sous 48 h.',
  chemin: '/experiences/entreprises',
});

export default async function Page() {
  await connection();
  const [textes, formats, avis] = await Promise.all([textesDePage('experiences'), cartesExperiences(), listerAvis({ limite: 4 })]);
  return <ExperiencesEntreprises textes={textes} formats={formats} avis={avis} />;
}
