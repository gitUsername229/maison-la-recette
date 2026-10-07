import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import InscriptionNewsletter from '@/frontend/components/InscriptionNewsletter';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import { classeBouton } from '@/frontend/styles/classes';

/** Textes de l'accueil, modifiables dans /admin/textes. */
export type TextesAccueil = Record<
  | 'surtitre' | 'titre' | 'introduction' | 'bouton'
  | 'podcastTitre' | 'podcastTexte' | 'experiencesTitre' | 'experiencesTexte' | 'studioTitre' | 'studioTexte'
  | 'avisTitre' | 'galerieTitre' | 'newsletterTitre' | 'newsletterTexte' | 'newsletterBouton' | 'mention',
  string
>;

type Props = { textes: TextesAccueil; avis: AvisAffiche[]; photos: PhotoGalerie[] };

/**
 * Textes, avis et photos de l'accueil : gérés dans /admin/textes, /admin/avis et /admin/photos (page « / »).
 * La première photo de la galerie (ordre le plus petit) sert d'image principale.
 */
export default function Home({ textes, avis, photos }: Props) {
  const [principale, ...autresPhotos] = photos;
  // Trois univers, trois aplats de couleur différents.
  const univers = [
    { id: 'podcast', titre: textes.podcastTitre, description: textes.podcastTexte, href: '/podcast', fond: 'bg-pastel' },
    { id: 'experiences', titre: textes.experiencesTitre, description: textes.experiencesTexte, href: '/experiences', fond: 'bg-pastel-chaud' },
    { id: 'studio', titre: textes.studioTitre, description: textes.studioTexte, href: '/studio', fond: 'bg-surface ring-1 ring-bordure' },
  ];
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <p className="w-fit rounded-full bg-pastel-chaud px-4 py-1.5 text-sm font-medium">{textes.surtitre}</p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] sm:text-7xl">{textes.titre}</h1>
          <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-texte-doux">{textes.introduction}</p>
          <Link href="/experiences" className={`${classeBouton} mt-8 inline-flex w-fit`}>{textes.bouton}</Link>
        </div>
        {principale && (
          <div className="relative mr-4 mb-4">
            <div aria-hidden="true" className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-pastel" />
            <Image src={principale.url} alt={principale.alt} width={1200} height={900} priority sizes="(min-width: 1024px) 45vw, 100vw" className="relative aspect-[4/3] w-full rounded-[2rem] object-cover" />
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 sm:grid-cols-3">
        {univers.map(({ id, titre, description, href, fond }) => (
          <Link key={id} href={href} className={`group grid content-start gap-3 rounded-3xl p-7 ${fond}`}>
            <h2 className="font-serif text-3xl group-hover:underline">{titre} <span aria-hidden="true">→</span></h2>
            <p className="whitespace-pre-line leading-relaxed">{description}</p>
          </Link>
        ))}
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <ListeAvis avis={avis} titre={textes.avisTitre} />
        <Galerie photos={autresPhotos} titre={textes.galerieTitre} />
        <InscriptionNewsletter titre={textes.newsletterTitre} texte={textes.newsletterTexte} bouton={textes.newsletterBouton} />
        {textes.mention && <p className="mt-16 whitespace-pre-line text-sm text-texte-doux">{textes.mention}</p>}
      </div>
    </main>
  );
}
