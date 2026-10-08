import { connection } from 'next/server';
import { experienceDe } from '@/backend/ateliers/catalogue';
import { evenementsLuma, type EvenementAffiche } from '@/backend/luma/client';
import { metadonnees } from '@/backend/seo';
import { AVIS } from '@/contenu/avis';
import { EXPERIENCES } from '@/contenu/experiences';
import { TEXTES } from '@/contenu/textes';
import { anneeDe } from '@/frontend/format';
import Experiences from '@/frontend/pages/experiences';

export const metadata = metadonnees({
  titre: 'Expériences',
  description: 'Ateliers, food tours et immersions autour de l’alimentation : prochaines dates et inscription sur Luma.',
  chemin: '/experiences',
});

type Props = { searchParams: Promise<{ annee?: string }> };

/** Événement et l'expérience qui porte son étiquette Luma. */
const avecExperience = (evenement: EvenementAffiche) => ({ ...evenement, experience: experienceDe(evenement) });

export default async function Page({ searchParams }: Props) {
  await connection(); // événements lus dans Luma (mis en cache quelques minutes)
  const [aVenir, passes, parametres] = await Promise.all([evenementsLuma('a-venir'), evenementsLuma('passes'), searchParams]);
  // ?annee=2026 ; par défaut, ou année sans événement passé : la plus récente.
  const annees = [...new Set((passes ?? []).map(e => anneeDe(e.debut)))];
  const annee = annees.find(a => a === Number(parametres.annee)) ?? annees[0] ?? null;
  return (
    <Experiences
      textes={TEXTES.experiences} avis={AVIS}
      evenements={aVenir && aVenir.map(avecExperience)}
      surDevis={EXPERIENCES.filter(e => e.reservation === 'devis')}
      passees={(passes ?? []).filter(e => anneeDe(e.debut) === annee).map(avecExperience)} annees={annees} annee={annee}
    />
  );
}
