import { connection } from 'next/server';
import { LECTEUR_PODCAST, LIENS_EMISSION, PRESENTATION_EMISSION, TYPES_EPISODE, type TypeEpisode } from '@/backend/podcast/emission';
import { compterParType, episodesAusha, filtrerEpisodes, pourLecteur, saisonsDisponibles } from '@/backend/podcast/episodes';
import { metadonnees } from '@/backend/seo';
import Podcast, { type FiltreEpisodes } from '@/frontend/pages/podcast';

export const metadata = metadonnees({
  titre: 'Podcast la recette',
  description: 'Le podcast de Julie Van Ossel : rencontres avec celles et ceux qui façonnent l’alimentation de demain.',
  chemin: '/podcast',
});

type Props = { searchParams: Promise<{ type?: string; saison?: string }> };

/** ?type=extrait|replay|tous ; sans paramètre (ou valeur inconnue) : les épisodes complets. */
function filtreDepuis(valeur?: string): FiltreEpisodes {
  if (valeur === 'tous') return 'tous';
  return TYPES_EPISODE.find((type): type is TypeEpisode => type === valeur) ?? 'complet';
}

export default async function Page({ searchParams }: Props) {
  await connection(); // épisodes lus dans le flux Ausha (mis en cache), nouveaux épisodes visibles sans rien faire
  const [tous, parametres] = await Promise.all([episodesAusha(), searchParams]);
  const filtre = filtreDepuis(parametres.type);
  const type = filtre === 'tous' ? undefined : filtre;
  const saisons = saisonsDisponibles(tous ?? [], type);
  // ?saison=3 ; par défaut, ou saison inconnue : la plus récente.
  const saison = saisons.find(s => s === Number(parametres.saison)) ?? saisons[0] ?? null;
  const episodes = saison === null ? [] : filtrerEpisodes(tous ?? [], { type, saison });
  return (
    <Podcast
      episodes={episodes.map(pourLecteur)} indisponible={tous === null}
      saisons={saisons} saison={saison} filtre={filtre} compteurs={compterParType(tous ?? [])} liens={LIENS_EMISSION} lecteur={LECTEUR_PODCAST}
      emission={PRESENTATION_EMISSION}
    />
  );
}
