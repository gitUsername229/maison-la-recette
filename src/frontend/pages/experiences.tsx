import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">← Maison La recette</Link>
      <h1 className="mt-8 font-serif text-4xl sm:text-6xl">Expériences</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed">Ateliers, good tours et immersions pour se retrouver autour de ce qui nous nourrit.</p>

      {experiences.length === 0 ? (
        <p className="mt-12 text-stone-600">Aucune expérience n’est proposée pour le moment.</p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map(experience => (
            <Link key={experience.id} href={`/experiences/${experience.slug}`} className="group flex flex-col border-t border-stone-300 pt-5">
              {experience.image && <Image src={experience.image} alt={experience.imageAlt} width={600} height={400} className="mb-4 aspect-[3/2] w-full rounded-xl object-cover" />}
              <p className="text-xs uppercase tracking-widest text-stone-500">{libelleType(experience.type)}</p>
              <h2 className="mt-2 font-serif text-2xl group-hover:underline">{experience.titre}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-stone-600">{experience.accroche}</p>
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
