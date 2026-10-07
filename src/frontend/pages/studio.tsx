import Link from 'next/link';

/** Textes de la page studio, modifiables dans /admin/textes. */
export type TextesStudio = Record<'surtitre' | 'titre' | 'introduction' | 'projetTitre' | 'projetTexte' | 'bouton', string>;

export default function Studio({ textes }: { textes: TextesStudio }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-6 lg:py-12">
      <span className="rounded-full bg-pastel px-3 py-1 text-xs font-semibold uppercase tracking-wider text-texte-doux">
        {textes.surtitre}
      </span>
      <h1 className="mt-4 text-3xl font-bold lg:text-4xl">
        {textes.titre}
      </h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-texte-doux">
        {textes.introduction}
      </p>
      <div className="mt-10 rounded-2xl border border-bordure bg-surface p-8">
        <h2 className="font-serif text-2xl font-semibold">{textes.projetTitre}</h2>
        <p className="mt-2 whitespace-pre-line text-texte-doux">
          {textes.projetTexte}
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-primaire px-5 py-3 text-sm font-semibold text-sur-primaire hover:bg-primaire-fort"
          >
            {textes.bouton}
          </Link>
        </div>
      </div>
    </main>
  );
}
