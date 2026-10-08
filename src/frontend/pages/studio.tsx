import Link from 'next/link';
import { classeGrandBouton, classeSurtitre } from '@/frontend/styles/classes';

/** Textes de la page studio, modifiables dans /admin/textes. */
export type TextesStudio = Record<'surtitre' | 'titre' | 'introduction' | 'projetTitre' | 'projetTexte' | 'bouton', string>;

export default function Studio({ textes }: { textes: TextesStudio }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-6 lg:py-12">
      <p className={classeSurtitre}>{textes.surtitre}</p>
      <h1 className="mt-4 font-titre text-4xl text-titre">{textes.titre}</h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{textes.introduction}</p>
      <div className="mt-10 rounded-2xl bg-fond p-6 sm:p-8">
        <h2 className="font-titre text-2xl text-titre">{textes.projetTitre}</h2>
        <p className="mt-2 whitespace-pre-line">{textes.projetTexte}</p>
        <Link href="/contact" className={`mt-6 ${classeGrandBouton.primaire} sm:w-fit sm:px-10`}>{textes.bouton}</Link>
      </div>
    </main>
  );
}
