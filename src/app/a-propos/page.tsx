import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos · Maison La recette',
  description: 'Notre histoire, nos engagements et notre mission autour de l’alimentation.',
};

export default function AProposPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        Notre histoire & mission
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        À propos de Maison La recette
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        Fondée par Julie Van Ossel, Maison La recette est née d’une envie : reconnecter le grand public
        et les entreprises aux personnes qui nous nourrissent, à travers des récits sonores et des
        expériences culinaires vivantes.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-xl font-bold">Nos expériences</h2>
          <p className="mt-2 text-sm text-stone-600">
            Des ateliers anti-gaspi, des good tours et des immersions pour mettre la main à la pâte.
          </p>
          <Link href="/experiences" className="mt-4 inline-block text-xs font-semibold text-amber-800 hover:underline">
            Voir les ateliers →
          </Link>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-xl font-bold">Le podcast</h2>
          <p className="mt-2 text-sm text-stone-600">
            Des épisodes pour écouter les témoignages de chefs, maraîchers et artisans passionnés.
          </p>
          <Link href="/podcast" className="mt-4 inline-block text-xs font-semibold text-amber-800 hover:underline">
            Écouter le podcast →
          </Link>
        </div>
      </div>
    </main>
  );
}
