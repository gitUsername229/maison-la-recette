import { connection } from 'next/server';
import { compterEpisodesParType, listerEpisodes, saisonsDisponibles } from '@/backend/contenus/contenus';
import { LECTEUR_PODCAST, LIENS_EMISSION, TYPES_EPISODE, type TypeEpisode } from '@/backend/podcast/emission';
import { sansEmojis } from '@/backend/podcast/flux';
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
  await connection(); // épisodes lus en base à chaque requête (nouveaux imports visibles aussitôt)
  const parametres = await searchParams;
  const filtre = filtreDepuis(parametres.type);
  const type = filtre === 'tous' ? undefined : filtre;
  const [saisons, compteurs] = await Promise.all([saisonsDisponibles(type), compterEpisodesParType()]);
  // ?saison=3 ; par défaut, ou saison inconnue : la plus récente.
  const saison = saisons.find(s => s === Number(parametres.saison)) ?? saisons[0] ?? null;
  const episodes = saison === null ? [] : await listerEpisodes({ type, saison });
  return (
    <Podcast
      episodes={episodes.map(({ id, titre, invite, resume, datePublication, dureeMin, image, embedUrl, audioUrl }) => (
        // Les résumés déjà en base (jamais réécrits par l'import) peuvent encore contenir des émojis : retirés à l'affichage.
        { id, titre: sansEmojis(titre), invite, resume: sansEmojis(resume), datePublication: datePublication.toISOString(), dureeMin, image, embedUrl, audioUrl }
      ))}
      saisons={saisons} saison={saison} filtre={filtre} compteurs={compteurs} liens={LIENS_EMISSION} lecteur={LECTEUR_PODCAST}
    />
  );
}
