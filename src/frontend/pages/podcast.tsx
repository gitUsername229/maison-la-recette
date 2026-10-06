import Image from 'next/image';
import Link from 'next/link';
import LecteurAusha from '@/frontend/components/LecteurAusha';
import Pastille from '@/frontend/components/Pastille';
import TexteRepliable from '@/frontend/components/TexteRepliable';
import { formatDate, libelle, TYPES_EPISODE } from '@/frontend/format';

export type FiltreEpisodes = 'complet' | 'extrait' | 'replay' | 'tous';

export type EpisodeAffiche = {
  id: number;
  titre: string;
  resume: string;
  type: string;
  saison: number;
  numero: number;
  datePublication: Date;
  dureeMin: number;
  image: string;
  embedUrl: string;
  invite: string | null;
};

type Props = {
  episodes: EpisodeAffiche[];
  filtre: FiltreEpisodes;
  compteurs: Record<Exclude<FiltreEpisodes, 'tous'>, number>;
  liens: readonly { plateforme: string; url: string }[];
};

const ONGLETS: { filtre: FiltreEpisodes; texte: string; href: string }[] = [
  { filtre: 'complet', texte: 'Épisodes complets', href: '/podcast' },
  { filtre: 'extrait', texte: 'Extraits', href: '/podcast?type=extrait' },
  { filtre: 'replay', texte: 'Replays', href: '/podcast?type=replay' },
  { filtre: 'tous', texte: 'Tout', href: '/podcast?type=tous' },
];

/** Épisodes regroupés par saison, la plus récente d'abord (l'ordre de la liste est conservé). */
function parSaison(episodes: EpisodeAffiche[]) {
  const saisons = new Map<number, EpisodeAffiche[]>();
  for (const episode of episodes) saisons.set(episode.saison, [...(saisons.get(episode.saison) ?? []), episode]);
  return [...saisons.entries()].sort(([a], [b]) => b - a);
}

function Episode({ episode, afficherType }: { episode: EpisodeAffiche; afficherType: boolean }) {
  const repere = [episode.numero > 0 && `Épisode ${episode.numero}`, formatDate(episode.datePublication), `${episode.dureeMin} min`].filter(Boolean).join(' · ');
  return (
    <li className="grid gap-4 border-t border-stone-300 py-6 sm:grid-cols-[112px_1fr]">
      <Image src={episode.image} alt="" width={112} height={112} className="h-28 w-28 rounded-xl object-cover" />
      <div className="grid min-w-0 gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            {repere}
            {afficherType && episode.type !== 'complet' && <Pastille statut="neutre" texte={libelle(TYPES_EPISODE, episode.type)} />}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-snug">{episode.titre}</h3>
          {episode.invite && <p className="text-sm text-stone-600">Avec {episode.invite}</p>}
        </div>
        {episode.resume && <TexteRepliable texte={episode.resume} />}
        <LecteurAusha url={episode.embedUrl} titre={episode.titre} />
      </div>
    </li>
  );
}

export default function Podcast({ episodes, filtre, compteurs, liens }: Props) {
  const total = compteurs.complet + compteurs.extrait + compteurs.replay;
  const nombre = (onglet: FiltreEpisodes) => (onglet === 'tous' ? total : compteurs[onglet]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="text-sm uppercase tracking-widest text-stone-500">Le podcast</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">la recette</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed">
        Julie Van Ossel part à la rencontre de celles et ceux qui façonnent l’alimentation de demain : chefs, productrices,
        artisans et entrepreneuses qui réinventent notre façon de manger.
      </p>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Écouter sur">
        {liens.map(lien => (
          <li key={lien.url}>
            <a href={lien.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full px-4 py-2 text-sm ring-1 ring-stone-300 hover:bg-white">
              {lien.plateforme}
            </a>
          </li>
        ))}
      </ul>

      <nav aria-label="Type d’épisodes" className="mt-10 flex flex-wrap gap-2">
        {ONGLETS.map(onglet => (
          <Link
            key={onglet.filtre}
            href={onglet.href}
            aria-current={filtre === onglet.filtre ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm ${filtre === onglet.filtre ? 'bg-encre text-creme' : 'text-stone-600 ring-1 ring-stone-200 hover:bg-white'}`}
          >
            {onglet.texte} <span className="opacity-70">({nombre(onglet.filtre)})</span>
          </Link>
        ))}
      </nav>

      {episodes.length === 0 ? (
        <p className="mt-10 text-stone-600">Aucun épisode pour l’instant.</p>
      ) : (
        parSaison(episodes).map(([saison, liste]) => (
          <section key={saison} className="mt-10">
            <h2 className="font-serif text-2xl">Saison {saison}</h2>
            <ul className="mt-2">
              {liste.map(episode => <Episode key={episode.id} episode={episode} afficherType={filtre === 'tous'} />)}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
