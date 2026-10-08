import Link from 'next/link';
import ChoixSaison from '@/frontend/components/ChoixSaison';
import LecteurPodcast, { type EpisodeLecteur } from '@/frontend/components/LecteurPodcast';
import LiensEcoute from '@/frontend/components/LiensEcoute';
import PresentationEmission from '@/frontend/components/PresentationEmission';

export type FiltreEpisodes = 'complet' | 'extrait' | 'replay' | 'tous';

type Props = {
  episodes: EpisodeLecteur[];                 // la saison choisie, la plus récente d'abord
  saisons: number[];
  saison: number | null;
  filtre: FiltreEpisodes;
  compteurs: Record<Exclude<FiltreEpisodes, 'tous'>, number>;
  liens: readonly { plateforme: string; url: string }[];
  lecteur: 'sur-mesure' | 'ausha';
  emission: { nom: string; accroche: string };
};

const ONGLETS: { filtre: FiltreEpisodes; texte: string; parametre?: string }[] = [
  { filtre: 'complet', texte: 'Épisodes complets' },
  { filtre: 'extrait', texte: 'Extraits', parametre: 'extrait' },
  { filtre: 'replay', texte: 'Replays', parametre: 'replay' },
  { filtre: 'tous', texte: 'Tout', parametre: 'tous' },
];

/**
 * /podcast (maquette) : l'émission (logo, nom, accroche), sa présentation, les plateformes, la saison et le type
 * d'épisodes, puis le lecteur sur mesure et la liste. Les quatre filtres de type restent (la maquette n'a qu'un
 * interrupteur « Voir les extraits » : question posée à Romain pour les replays).
 */
export default function Podcast({ episodes, saisons, saison, filtre, compteurs, liens, lecteur, emission }: Props) {
  const total = compteurs.complet + compteurs.extrait + compteurs.replay;
  const nombre = (onglet: FiltreEpisodes) => (onglet === 'tous' ? total : compteurs[onglet]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:py-12">
      <PresentationEmission nom={emission.nom} accroche={emission.accroche} niveau="h1" />
      <div className="mt-8 grid gap-4 leading-relaxed">
        <p>
          <strong className="text-xl">Depuis 2023</strong>, Julie Van Ossel, journaliste, vous emmène à la rencontre de celles et ceux
          qui façonnent l’alimentation de demain : des chefs, productrices, artisans, entrepreneuses qui bousculent les codes
          pour réinventer notre façon de manger.
        </p>
        <p>
          À travers leurs histoires, ils nous dévoilent les coulisses de nos assiettes, leur impact sur notre société, notre
          santé et notre planète… et nous partagent ici leurs ingrédients du changement.
        </p>
      </div>
      <LiensEcoute titre="À écouter aussi sur" liens={liens} className="mt-8" />

      <div className="mt-10 grid gap-4">
        {saison !== null && saisons.length > 1 && <ChoixSaison saisons={saisons} saison={saison} />}
        <nav aria-label="Type d’épisodes" className="flex flex-wrap gap-2">
          {ONGLETS.map(onglet => (
            <Link
              key={onglet.filtre}
              href={onglet.parametre ? `/podcast?type=${onglet.parametre}` : '/podcast'}
              aria-current={filtre === onglet.filtre ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm ${filtre === onglet.filtre ? 'bg-primaire font-bold text-sur-primaire' : 'bg-fond hover:bg-pastel'}`}
            >
              {onglet.texte} <span className={filtre === onglet.filtre ? '' : 'text-texte-doux'}>({nombre(onglet.filtre)})</span>
            </Link>
          ))}
        </nav>
      </div>

      {episodes.length === 0 ? (
        <p className="mt-10 text-texte-doux">Aucun épisode pour l’instant.</p>
      ) : (
        <div className="mt-6">
          {/* Une nouvelle liste (saison ou type) repart de son premier épisode. */}
          <LecteurPodcast key={`${filtre}-${saison}`} episodes={episodes} lecteur={lecteur} />
        </div>
      )}
    </main>
  );
}
