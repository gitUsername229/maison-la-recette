import type { Metadata } from 'next';
import { connection } from 'next/server';
import { compterEpisodesParType, listerEpisodes } from '@/backend/contenus/contenus';
import { LIENS_EMISSION, TYPES_EPISODE, type TypeEpisode } from '@/backend/podcast/emission';
import Podcast, { type FiltreEpisodes } from '@/frontend/pages/podcast';

export const metadata: Metadata = {
  title: 'Podcast la recette | Maison La recette',
  description: 'Le podcast de Julie Van Ossel : rencontres avec celles et ceux qui façonnent l’alimentation de demain.',
};

type Props = { searchParams: Promise<{ type?: string }> };

/** ?type=extrait|replay|tous ; sans paramètre (ou valeur inconnue) : les épisodes complets. */
function filtreDepuis(valeur?: string): FiltreEpisodes {
  if (valeur === 'tous') return 'tous';
  return TYPES_EPISODE.find((type): type is TypeEpisode => type === valeur) ?? 'complet';
}

export default async function Page({ searchParams }: Props) {
  await connection(); // épisodes lus en base à chaque requête (nouveaux imports visibles aussitôt)
  const filtre = filtreDepuis((await searchParams).type);
  const [episodes, compteurs] = await Promise.all([
    listerEpisodes({ type: filtre === 'tous' ? undefined : filtre }),
    compterEpisodesParType(),
  ]);
  return <Podcast episodes={episodes} filtre={filtre} compteurs={compteurs} liens={LIENS_EMISSION} />;
}
