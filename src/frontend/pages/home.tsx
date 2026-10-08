import Image from 'next/image';
import Link from 'next/link';
import Carrousel from '@/frontend/components/Carrousel';
import CarteExperience, { type CarteExperienceDonnees } from '@/frontend/components/CarteExperience';
import { type PhotoGalerie } from '@/frontend/components/Galerie';
import Icone from '@/frontend/components/Icone';
import InscriptionNewsletter from '@/frontend/components/InscriptionNewsletter';
import LecteurPodcast, { type EpisodeLecteur } from '@/frontend/components/LecteurPodcast';
import LiensEcoute from '@/frontend/components/LiensEcoute';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import MosaiquePhotos, { type PhotoMosaique } from '@/frontend/components/MosaiquePhotos';
import PresentationEmission from '@/frontend/components/PresentationEmission';
import { classeGrandBouton } from '@/frontend/styles/classes';

/** Textes de l'accueil, modifiables dans /admin/textes. */
export type TextesAccueil = Record<
  | 'slogan' | 'presentation' | 'boutonPodcast' | 'boutonEntreprises' | 'podcastBouton'
  | 'experiencesBlocTitre' | 'experiencesBlocTexte' | 'experiencesBouton'
  | 'entreprisesTitre' | 'entreprisesTexte' | 'point1Titre' | 'point1Texte' | 'point2Titre' | 'point2Texte' | 'point3Titre' | 'point3Texte'
  | 'entreprisesBouton' | 'studioBlocTitre' | 'studioBlocTexte' | 'studioBouton' | 'newsletterTitre' | 'newsletterAccroche' | 'newsletterBouton',
  string
>;

type Props = {
  textes: TextesAccueil;
  photos: PhotoGalerie[];                     // galerie de l'accueil (/admin/photos) : la première sert de fond
  emission: { nom: string; accroche: string };
  extrait: EpisodeLecteur | null;             // dernier extrait publié
  lecteur: 'sur-mesure' | 'ausha';
  liens: readonly { plateforme: string; url: string }[];
  experiences: CarteExperienceDonnees[];
  avis: AvisAffiche[];
  photosEntreprises: PhotoMosaique[];
};

const conteneur = 'mx-auto max-w-6xl px-5 py-14 lg:px-6 lg:py-20';
const titreSection = 'font-titre text-4xl'; // en vert vif sur fond clair (text-titre), blanc sur fond vert

/**
 * Accueil (maquette) : photo plein écran, titre et deux boutons ; le podcast et l'extrait du dernier épisode ;
 * les expériences et les avis sur fond vert foncé ; l'offre entreprises ; le studio ; la newsletter.
 */
export default function Home({ textes, photos, emission, extrait, lecteur, liens, experiences, avis, photosEntreprises }: Props) {
  const [principale] = photos;
  const points = [
    [textes.point1Titre, textes.point1Texte], [textes.point2Titre, textes.point2Texte], [textes.point3Titre, textes.point3Texte],
  ];
  return (
    <main>
      {/* L'en-tête (transparent sur l'accueil) se pose sur la photo. */}
      <section className="zone-sombre relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-fond-sombre pb-28 pt-32 text-sur-fond-sombre">
        {principale && <Image src={principale.url} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-voile/55" />
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-6">
          <h1 className="max-w-3xl font-titre text-4xl sm:text-6xl">{textes.slogan}</h1>
          <p className="mt-5 max-w-xl whitespace-pre-line sm:text-lg">{textes.presentation}</p>
          <div className="mt-12 grid max-w-[334px] gap-4 sm:flex sm:max-w-none">
            <Link href="/podcast" className={`${classeGrandBouton.primaire} sm:w-auto sm:px-10`}>{textes.boutonPodcast}</Link>
            <Link href="/experiences/entreprises" className={`${classeGrandBouton.secondaire} sm:w-auto sm:px-10`}>{textes.boutonEntreprises}</Link>
          </div>
        </div>
        <a href="#suite" aria-label="Voir la suite" className="absolute bottom-8 left-1/2 -translate-x-1/2 p-2">
          <Icone nom="fleche-bas" taille={24} />
        </a>
      </section>

      <section id="suite" className="bg-fond-doux">
        <div className={`${conteneur} grid gap-6 lg:grid-cols-2 lg:content-start lg:items-start lg:gap-x-12`}>
          <PresentationEmission nom={emission.nom} accroche={emission.accroche} />
          {extrait && (
            <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
              <LecteurPodcast episodes={[extrait]} lecteur={lecteur} etiquette="Extrait du dernier épisode" liste={false} niveau="h3" />
            </div>
          )}
          <LiensEcoute titre="Écouter aussi sur" liens={liens} className="lg:col-start-1" />
          <Link href="/podcast" className={`${classeGrandBouton.contour} lg:col-start-1 lg:max-w-[334px]`}>{textes.podcastBouton}</Link>
        </div>
      </section>

      <section className="zone-sombre bg-fond-sombre text-sur-fond-sombre">
        <div className={conteneur}>
          <h2 className={titreSection}>{textes.experiencesBlocTitre}</h2>
          <p className="mt-3 max-w-xl whitespace-pre-line">{textes.experiencesBlocTexte}</p>
          {experiences.length > 0 && (
            <div className="mt-8">
              <Carrousel libelle={textes.experiencesBlocTitre}>
                {experiences.map(experience => <CarteExperience key={experience.id} experience={experience} action="decouvrir" />)}
              </Carrousel>
            </div>
          )}
          <Link href="/experiences" className={`mt-8 ${classeGrandBouton.secondaire} lg:max-w-[334px]`}>{textes.experiencesBouton}</Link>
          {avis.length > 0 && <div className="mt-14"><ListeAvis avis={avis} surFondSombre /></div>}
        </div>
      </section>

      <section className="bg-fond">
        <div className={`${conteneur} grid gap-6 lg:grid-cols-2 lg:gap-x-12`}>
          <div>
            <h2 className={`${titreSection} text-titre`}>{textes.entreprisesTitre}</h2>
            <p className="mt-3 whitespace-pre-line text-lg">{textes.entreprisesTexte}</p>
          </div>
          {photosEntreprises.length > 0 && (
            <MosaiquePhotos photos={photosEntreprises} className="-mx-5 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mx-0 lg:self-center" />
          )}
          <ul className="grid gap-4 lg:col-start-1">
            {points.map(([titre, texte]) => (
              <li key={titre} className="flex gap-3">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primaire text-sm font-bold text-sur-primaire">✓</span>
                <div>
                  <p className="font-bold text-titre">{titre}</p>
                  <p className="whitespace-pre-line text-sm">{texte}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/experiences/entreprises" className={`${classeGrandBouton.primaire} lg:col-start-1 lg:max-w-[334px]`}>{textes.entreprisesBouton}</Link>
        </div>
      </section>

      <section className="bg-fond-doux">
        <div className={conteneur}>
          <h2 className={`${titreSection} text-titre`}>{textes.studioBlocTitre}</h2>
          <p className="mt-3 max-w-xl whitespace-pre-line">{textes.studioBlocTexte}</p>
          <Link href="/studio" className={`mt-8 ${classeGrandBouton.contour} lg:max-w-[334px]`}>{textes.studioBouton}</Link>
        </div>
      </section>

      <section className="zone-sombre bg-fond-sombre text-sur-fond-sombre">
        <div className={conteneur}>
          <InscriptionNewsletter titre={textes.newsletterTitre} texte={textes.newsletterAccroche} bouton={textes.newsletterBouton} />
        </div>
      </section>
    </main>
  );
}
