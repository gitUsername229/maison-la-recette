import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import InscriptionNewsletter from '@/frontend/components/InscriptionNewsletter';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';

/** Textes de l'accueil, modifiables dans /admin/textes. */
export type TextesAccueil = Record<
  | 'surtitre' | 'titre' | 'introduction' | 'bouton'
  | 'podcastTitre' | 'podcastTexte' | 'experiencesTitre' | 'experiencesTexte' | 'studioTitre' | 'studioTexte'
  | 'avisTitre' | 'galerieTitre' | 'newsletterTitre' | 'newsletterTexte' | 'newsletterBouton' | 'mention',
  string
>;

type Props = { textes: TextesAccueil; avis: AvisAffiche[]; photos: PhotoGalerie[] };

/** Textes, avis et photos de l'accueil : gérés dans /admin/textes, /admin/avis et /admin/photos (page « / »). */
export default function Home({ textes, avis, photos }: Props) {
  const univers = [
    { id: 'podcast', titre: textes.podcastTitre, description: textes.podcastTexte },
    { id: 'experiences', titre: textes.experiencesTitre, description: textes.experiencesTexte, href: '/experiences' },
    { id: 'studio', titre: textes.studioTitre, description: textes.studioTexte },
  ];
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
      <p className="mb-6 text-sm uppercase tracking-widest">{textes.surtitre}</p>
      <h1 className="font-serif text-5xl sm:text-7xl">{textes.titre}</h1>
      <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed">{textes.introduction}</p>
      <Link href="/experiences" className="mt-10 inline-flex w-fit rounded-full bg-encre px-6 py-3.5 font-medium text-creme transition hover:bg-black">
        {textes.bouton}
      </Link>
      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {univers.map(({ id, titre, description, href }) => (
          <section key={id} className="border-t border-stone-300 pt-5">
            <h2 className="font-serif text-2xl">{href ? <Link href={href} className="hover:underline">{titre} →</Link> : titre}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-600">{description}</p>
          </section>
        ))}
      </div>
      <ListeAvis avis={avis} titre={textes.avisTitre} />
      <Galerie photos={photos} titre={textes.galerieTitre} />
      <InscriptionNewsletter titre={textes.newsletterTitre} texte={textes.newsletterTexte} bouton={textes.newsletterBouton} />
      {textes.mention && <p className="mt-16 whitespace-pre-line text-sm text-stone-500">{textes.mention}</p>}
    </main>
  );
}
