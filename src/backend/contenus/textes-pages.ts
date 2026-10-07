import 'server-only';
import { z } from 'zod';
import { estAdmin, exigerAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import {
  creerTextesManquants, EMPLACEMENTS, emplacement, estPageTextes, LONGUEUR_MAX, TEXTES_PAR_DEFAUT, type PageTextes, type TextesDe,
} from './textes-par-defaut';

/** Textes d'une page pour l'affichage : celui de Julie, ou le texte d'origine s'il n'est pas (encore) en base. */
export async function textesDePage<P extends PageTextes>(page: P): Promise<TextesDe<P>> {
  const textes: Record<string, string> = Object.fromEntries(Object.entries(TEXTES_PAR_DEFAUT[page]).map(([cle, { texte }]) => [cle, texte]));
  for (const { cle, texte } of await prisma.textePage.findMany({ where: { page }, select: { cle: true, texte: true } })) {
    if (Object.hasOwn(textes, cle)) textes[cle] = texte;
  }
  return textes as TextesDe<P>;
}

/**
 * GET /api/textes (?page=accueil) : les textes dans l'ordre des pages, avec ce qu'il faut à l'admin pour guider
 * la saisie (emplacement, forme, longueur maximale, texte d'origine). Pour l'admin, les emplacements ajoutés
 * dans le code sont créés au passage : Julie les retrouve même si le seed n'a pas été relancé.
 */
export const lister = endpoint(async (request: Request) => {
  const page = new URL(request.url).searchParams.get('page');
  if (page && !estPageTextes(page)) throw new ApiError(400, `Page inconnue : ${Object.keys(TEXTES_PAR_DEFAUT).join(', ')}.`);
  if (await estAdmin(request)) await creerTextesManquants(prisma);

  const enBase = new Map((await prisma.textePage.findMany({ where: page ? { page } : {} })).map(t => [`${t.page}/${t.cle}`, t]));
  return json(EMPLACEMENTS.filter(e => !page || e.page === page).flatMap(e => {
    const ligne = enBase.get(`${e.page}/${e.cle}`);
    if (!ligne) return [];
    return [{
      id: ligne.id, page: e.page, cle: e.cle, libelle: e.libelle, format: e.format, facultatif: Boolean(e.facultatif),
      longueurMax: LONGUEUR_MAX[e.format], texte: ligne.texte, texteOrigine: e.texte, modifie: ligne.texte !== e.texte, updatedAt: ligne.updatedAt,
    }];
  }));
});

const modificationSchema = z.object({ texte: z.string() }).strict();

/** PUT /api/textes/[id] (admin) : nouveau texte d'un emplacement. Il n'y a ni création ni suppression : les emplacements viennent du code. */
export const modifier = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const id = positiveId((await context.params).id);
  const { texte: saisi } = modificationSchema.parse(await request.json());
  const ligne = await prisma.textePage.findUniqueOrThrow({ where: { id } });
  const regle = emplacement(ligne.page, ligne.cle);
  if (!regle) throw new ApiError(404, 'Ce texte n’est plus utilisé sur le site.');

  // Seuls les paragraphes gardent leurs retours à la ligne.
  const texte = regle.format === 'paragraphe' ? saisi.trim() : saisi.replace(/\s+/g, ' ').trim();
  if (!texte && !regle.facultatif) throw new ApiError(400, 'Champ obligatoire.', { champ: 'texte' });
  if (texte.length > LONGUEUR_MAX[regle.format]) throw new ApiError(400, `${LONGUEUR_MAX[regle.format]} caractères maximum.`, { champ: 'texte' });
  return json(await prisma.textePage.update({ where: { id }, data: { texte } }));
});
