import type { Metadata } from 'next';
import { EXPERIENCES } from '@/contenu/experiences';
import Contact from '@/frontend/pages/contact';

export const metadata: Metadata = {
  title: 'Demande de devis | Maison La recette',
  description: 'Expérience d’équipe, studio podcast, sponsoring ou événement : demandez un devis, Julie vous rappelle sous 48 h.',
};

type Props = { searchParams: Promise<{ experience?: string }> };

/** ?experience=<slug> : l'expérience déjà choisie dans le formulaire (liens « Demander un devis »). */
export default async function Page({ searchParams }: Props) {
  const { experience } = await searchParams;
  return (
    <Contact
      experiences={EXPERIENCES.map(({ slug, titre }) => ({ slug, titre }))}
      experience={EXPERIENCES.some(e => e.slug === experience) ? experience : undefined}
    />
  );
}
