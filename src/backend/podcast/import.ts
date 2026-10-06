import 'server-only';
import { exigerAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json } from '@/backend/http';
import { lireFlux, type EpisodeDuFlux } from './flux';

/**
 * Crée ou met à jour les épisodes, retrouvés par leur guid : relancer l'import ne crée pas de doublon.
 * Pour un épisode existant, seuls les champs venant d'Ausha sont mis à jour : le résumé, le type,
 * l'invité et les liens des plateformes saisis dans l'admin ne sont jamais écrasés.
 */
export async function importerEpisodes(episodes: EpisodeDuFlux[]) {
  return prisma.$transaction(async tx => {
    let crees = 0;
    for (const { resume, type, ...duFlux } of episodes) {
      const { count } = await tx.episode.updateMany({ where: { guid: duFlux.guid }, data: duFlux });
      if (count === 0) {
        await tx.episode.create({ data: { ...duFlux, resume, type } });
        crees++;
      }
    }
    return { crees, misAJour: episodes.length - crees };
  }, { timeout: 30_000 });
}

/** POST /api/episodes/import (admin) : lit le flux AUSHA_RSS_URL et met les épisodes à jour. */
export const importerDepuisAusha = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  const url = process.env.AUSHA_RSS_URL;
  if (!url?.startsWith('https://feed.ausha.co/')) throw new ApiError(503, 'Configurer AUSHA_RSS_URL (flux RSS Ausha) dans .env.local');
  const reponse = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' }).catch(() => null);
  if (!reponse?.ok) throw new ApiError(502, 'Flux Ausha injoignable. Réessayez dans quelques minutes.');
  const episodes = lireFlux(await reponse.text());
  if (episodes.length === 0) throw new ApiError(502, 'Le flux Ausha ne contient aucun épisode lisible.');
  const { crees, misAJour } = await importerEpisodes(episodes);
  return json({ crees, misAJour, message: `Import terminé : ${crees} épisode(s) ajouté(s), ${misAJour} mis à jour.` });
});
