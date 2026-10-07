import type { Metadata } from 'next';
import Link from 'next/link';
import PhotoCarte from '@/frontend/components/PhotoCarte';
import { formatDuree, formatPrix, libelleType } from '@/frontend/format';

export const metadata: Metadata = {
  title: 'Expériences | Maison La recette',
  description: 'Ateliers, good tours et immersions autour de l’alimentation, à réserver en ligne ou sur devis.',
};

export type ExperienceResume = {
  id: number;
  slug: string;
  type: string;
  titre: string;
  accroche: string;
  dureeMin: number;
  prixCents: number;
  reservableEnLigne: boolean;
  image: string;
  imageAlt: string;
};

export default function Experiences({ experiences }: { experiences: ExperienceResume[] }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <Link href="/" className="text-sm text-texte-doux hover:text-texte">← Maison La recette</Link>
      <h1 className="mt-8 font-serif text-4xl sm:text-6xl">Expériences</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed">Ateliers, good tours et immersions pour se retrouver autour de ce qui nous nourrit.</p>

      {experiences.length === 0 ? (
        <p className="mt-12 text-texte-doux">Aucune expérience n’est proposée pour le moment.</p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map(experience => (
            <Link key={experience.id} href={`/experiences/${experience.slug}`} className="group flex flex-col">
              {experience.image && <div className="mb-4"><PhotoCarte src={experience.image} alt={experience.imageAlt} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" /></div>}
              <p className="w-fit rounded-full bg-pastel px-3 py-1 text-xs font-semibold uppercase tracking-wider">{libelleType(experience.type)}</p>
              <h2 className="mt-2 font-serif text-2xl group-hover:underline">{experience.titre}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-texte-doux">{experience.accroche}</p>
              <p className="mt-5 text-sm">
                {experience.reservableEnLigne ? `${formatPrix(experience.prixCents)} / pers.` : 'Sur devis'} · {formatDuree(experience.dureeMin)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
