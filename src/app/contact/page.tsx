import type { Metadata } from 'next';
import { listerExperiences } from '@/backend/ateliers/catalogue';
import Contact from '@/frontend/pages/contact';

export const metadata: Metadata = {
  title: 'Demande de devis | Maison La recette',
  description: 'Expérience d’équipe, studio podcast, sponsoring ou événement : demandez un devis, Julie vous rappelle sous 48 h.',
};

type Props = { searchParams: Promise<{ experience?: string }> };

export default async function Page({ searchParams }: Props) {
  const { experience } = await searchParams;
  const experiences = await listerExperiences();
  const choisie = experiences.find(e => e.slug === experience);
  return (
    <Contact
      experiences={experiences.map(({ id, titre }) => ({ id, titre }))}
      experienceId={choisie?.id}
    />
  );
}
