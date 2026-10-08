import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { experienceAvecDates, experienceParSlug } from '@/backend/ateliers/catalogue';
import { metadonnees } from '@/backend/seo';
import Experience from '@/frontend/pages/experience';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const experience = experienceParSlug(slug);
  return experience ? metadonnees({ titre: experience.titre, description: experience.accroche, chemin: `/experiences/${slug}`, image: { url: experience.image, alt: experience.imageAlt } }) : {};
}

export default async function Page({ params }: Props) {
  await connection(); // prochaines dates lues dans Luma (mises en cache quelques minutes)
  const page = await experienceAvecDates((await params).slug);
  if (!page) notFound();
  return <Experience experience={page.experience} galerie={page.galerie} dates={page.evenements} />;
}
