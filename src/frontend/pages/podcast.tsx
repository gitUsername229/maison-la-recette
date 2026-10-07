import Image from 'next/image';
import Link from 'next/link';
import ChoixSaison from '@/frontend/components/ChoixSaison';
import LecteurPodcast, { type EpisodeLecteur } from '@/frontend/components/LecteurPodcast';

export type FiltreEpisodes = 'complet' | 'extrait' | 'replay' | 'tous';

type Props = {
  episodes: EpisodeLecteur[];                 // la saison choisie, la plus récente d'abord
  saisons: number[];
  saison: number | null;
  filtre: FiltreEpisodes;
  compteurs: Record<Exclude<FiltreEpisodes, 'tous'>, number>;
  liens: readonly { plateforme: string; url: string }[];
  lecteur: 'sur-mesure' | 'ausha';
};

const ONGLETS: { filtre: FiltreEpisodes; texte: string; parametre?: string }[] = [
  { filtre: 'complet', texte: 'Épisodes complets' },
  { filtre: 'extrait', texte: 'Extraits', parametre: 'extrait' },
  { filtre: 'replay', texte: 'Replays', parametre: 'replay' },
  { filtre: 'tous', texte: 'Tout', parametre: 'tous' },
];

/** /podcast (maquette « Frame 15 ») : logo, plateformes, type d'épisodes et saison, lecteur sur mesure et liste. */
export default function Podcast({ episodes, saisons, saison, filtre, compteurs, liens, lecteur }: Props) {
  const total = compteurs.complet + compteurs.extrait + compteurs.replay;
  const nombre = (onglet: FiltreEpisodes) => (onglet === 'tous' ? total : compteurs[onglet]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:py-12">
      <h1 className="sr-only">Le podcast la recette</h1>
      <Image src="/images/podcast/logo-la-recette.png" alt="la recette, le podcast" width={224} height={224} priority className="mx-auto h-[224px] w-[224px]" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg">
        Julie Van Ossel part à la rencontre de celles et ceux qui façonnent l’alimentation de demain : chefs, productrices,
        artisans et entrepreneuses qui réinventent notre façon de manger.
      </p>
      <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Écouter sur">
        {liens.map(lien => (
          <li key={lien.url}>
            <a href={lien.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full px-4 py-2 text-sm ring-1 ring-bordure-forte hover:bg-fond-doux">
              {lien.plateforme}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Type d’épisodes" className="flex flex-wrap gap-2">
          {ONGLETS.map(onglet => (
            <Link
              key={onglet.filtre}
              href={onglet.parametre ? `/podcast?type=${onglet.parametre}` : '/podcast'}
              aria-current={filtre === onglet.filtre ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm ${filtre === onglet.filtre ? 'bg-primaire font-bold text-sur-primaire' : 'ring-1 ring-bordure hover:bg-fond-doux'}`}
            >
              {onglet.texte} <span className={filtre === onglet.filtre ? '' : 'text-texte-doux'}>({nombre(onglet.filtre)})</span>
            </Link>
          ))}
        </nav>
        {saison !== null && saisons.length > 1 && <ChoixSaison saisons={saisons} saison={saison} />}
      </div>

      {episodes.length === 0 ? (
        <p className="mt-10 text-texte-doux">Aucun épisode pour l’instant.</p>
      ) : (
        <div className="mt-8">
          {/* Une nouvelle liste (saison ou type) repart de son premier épisode. */}
          <LecteurPodcast key={`${filtre}-${saison}`} episodes={episodes} lecteur={lecteur} />
        </div>
      )}
    </main>
  );
}
