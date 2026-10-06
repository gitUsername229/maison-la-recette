import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Studio de production · Maison La recette',
  description: 'Production de podcasts sur-mesure et sponsoring pour les marques engagées.',
};

export default function StudioPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        Studio & Sponsoring B2B
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        Studio de production
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        Maison La recette conçoit et produit des récits audios authentiques pour les marques et
        organisations engagées autour de l’alimentation et du vivant.
      </p>
      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
        <h2 className="font-serif text-2xl font-semibold">Vous avez un projet audio ?</h2>
        <p className="mt-2 text-stone-600">
          De l’écriture au mixage en passant par les interviews de vos équipes ou producteurs partenaires.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-encre px-5 py-3 text-sm font-semibold text-creme hover:bg-black transition-colors"
          >
            Demander un devis studio
          </Link>
        </div>
      </div>
    </main>
  );
}
