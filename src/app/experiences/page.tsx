import { connection } from 'next/server';
import { cartesExperiences, sessionsPassees } from '@/backend/ateliers/catalogue';
import { metadonnees } from '@/backend/seo';
import { AVIS } from '@/contenu/avis';
import { TEXTES } from '@/contenu/textes';
import { anneeDe } from '@/frontend/format';
import Experiences from '@/frontend/pages/experiences';

export const metadata = metadonnees({
  titre: 'Expériences',
  description: 'Ateliers, food tours et immersions autour de l’alimentation : prochaines dates, places restantes et inscription en ligne.',
  chemin: '/experiences',
});

type Props = { searchParams: Promise<{ annee?: string }> };

export default async function Page({ searchParams }: Props) {
  await connection(); // prochaines dates et places lues à chaque requête
  const [experiences, passees, parametres] = await Promise.all([cartesExperiences(), sessionsPassees(), searchParams]);
  // ?annee=2026 ; par défaut, ou année sans session passée : la plus récente.
  const annees = [...new Set(passees.map(s => anneeDe(s.dateDebut)))];
  const annee = annees.find(a => a === Number(parametres.annee)) ?? annees[0] ?? null;
  return (
    <Experiences
      textes={TEXTES.experiences} experiences={experiences} avis={AVIS}
      passees={passees.filter(s => anneeDe(s.dateDebut) === annee)} annees={annees} annee={annee}
    />
  );
}
