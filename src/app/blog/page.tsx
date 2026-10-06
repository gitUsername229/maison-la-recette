import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog & Récits · Maison La recette',
  description: 'Articles, astuces de cuisine durable et actualités.',
};

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        Blog & Conseils
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        Le Blog
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        Retrouvez ici nos articles, idées de recettes anti-gaspi et réflexions sur l’alimentation durable.
      </p>
      <div className="mt-12 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
        <p>Les articles du blog sont en cours de rédaction.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-amber-800 hover:underline">
          ← Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
