import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import Icone from '@/frontend/components/Icone';
import InscriptionNewsletter from '@/frontend/components/InscriptionNewsletter';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';

/** Textes de l'accueil, modifiables dans /admin/textes. */
export type TextesAccueil = Record<
  | 'surtitre' | 'titre' | 'introduction' | 'bouton' | 'boutonPodcast'
  | 'podcastTitre' | 'podcastTexte' | 'experiencesTitre' | 'experiencesTexte' | 'studioTitre' | 'studioTexte'
  | 'avisTitre' | 'galerieTitre' | 'newsletterTitre' | 'newsletterTexte' | 'newsletterBouton' | 'mention',
  string
>;

type Props = { textes: TextesAccueil; avis: AvisAffiche[]; photos: PhotoGalerie[] };

/**
 * Accueil (maquette « Frame 11 ») : photo plein écran floutée, titre, bouton vers le podcast et lien vers les expériences.
 * La première photo de la galerie (ordre le plus petit, /admin/photos) sert de fond ; les textes sont dans /admin/textes.
 */
export default function Home({ textes, avis, photos }: Props) {
  const [principale, ...autresPhotos] = photos;
  const univers = [
    { id: 'podcast', titre: textes.podcastTitre, description: textes.podcastTexte, href: '/podcast', fond: 'bg-pastel' },
    { id: 'experiences', titre: textes.experiencesTitre, description: textes.experiencesTexte, href: '/experiences', fond: 'bg-fond-doux' },
    { id: 'studio', titre: textes.studioTitre, description: textes.studioTexte, href: '/studio', fond: 'bg-pastel-chaud' },
  ];
  return (
    <main>
      <section className="relative isolate flex min-h-[calc(100svh-5rem)] flex-col items-center justify-center overflow-hidden bg-fond-sombre px-6 py-16 text-center text-sur-fond-sombre">
        {principale && (
          <Image src={principale.url} alt="" fill priority sizes="100vw" className="-z-20 scale-110 object-cover blur-[8px]" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-voile/45" />
        <p className="text-lg tracking-wide">{textes.surtitre}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[0.04em] sm:text-7xl">{textes.titre}</h1>
        <p className="mt-4 max-w-xl whitespace-pre-line text-lg tracking-[0.04em]">{textes.introduction}</p>
        <Link href="/podcast" className="mt-14 flex h-[51px] w-full max-w-[334px] items-center justify-center rounded-full bg-primaire text-lg tracking-[0.04em] text-sur-primaire hover:bg-primaire-fort">
          {textes.boutonPodcast}
        </Link>
        <Link href="/experiences" className="mt-5 text-lg font-bold hover:underline">{textes.bouton}</Link>
        <a href="#suite" aria-label="Voir la suite" className="absolute bottom-8 p-2">
          <Icone nom="fleche-bas" taille={24} />
        </a>
      </section>

      <div id="suite" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-16 lg:px-6">
        <section className="grid gap-5 sm:grid-cols-3">
          {univers.map(({ id, titre, description, href, fond }) => (
            <Link key={id} href={href} className={`group grid content-start gap-3 rounded-xl p-7 ${fond}`}>
              <h2 className="text-3xl group-hover:underline">{titre} <span aria-hidden="true">→</span></h2>
              <p className="whitespace-pre-line">{description}</p>
            </Link>
          ))}
        </section>
        <div className="mt-14"><ListeAvis avis={avis} titre={textes.avisTitre} /></div>
        <Galerie photos={autresPhotos} titre={textes.galerieTitre} />
        <InscriptionNewsletter titre={textes.newsletterTitre} texte={textes.newsletterTexte} bouton={textes.newsletterBouton} />
        {textes.mention && <p className="mt-16 whitespace-pre-line text-sm text-texte-doux">{textes.mention}</p>}
      </div>
    </main>
  );
}
