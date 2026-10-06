import Link from 'next/link';

/** Textes de la page studio, modifiables dans /admin/textes. */
export type TextesStudio = Record<'surtitre' | 'titre' | 'introduction' | 'projetTitre' | 'projetTexte' | 'bouton', string>;

export default function Studio({ textes }: { textes: TextesStudio }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        {textes.surtitre}
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        {textes.titre}
      </h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-stone-600">
        {textes.introduction}
      </p>
      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
        <h2 className="font-serif text-2xl font-semibold">{textes.projetTitre}</h2>
        <p className="mt-2 whitespace-pre-line text-stone-600">
          {textes.projetTexte}
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-encre px-5 py-3 text-sm font-semibold text-creme hover:bg-black transition-colors"
          >
            {textes.bouton}
          </Link>
        </div>
      </div>
    </main>
  );
}
