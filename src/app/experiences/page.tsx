import { connection } from 'next/server';
import { cartesExperiences } from '@/backend/ateliers/catalogue';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { metadonnees } from '@/backend/seo';
import Experiences from '@/frontend/pages/experiences';

export const metadata = metadonnees({
  titre: 'Expériences',
  description: 'Ateliers, good tours et immersions autour de l’alimentation : prochaines dates, places restantes et inscription en ligne.',
  chemin: '/experiences',
});

export default async function Page() {
  await connection(); // prochaines dates et places lues à chaque requête
  const [textes, experiences] = await Promise.all([textesDePage('experiences'), cartesExperiences()]);
  return <Experiences textes={textes} experiences={experiences} />;
}
