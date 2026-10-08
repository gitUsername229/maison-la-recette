import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { TEXTES_PAR_DEFAUT, type PageTextes, type TextesDe } from './textes-par-defaut';

/** Textes d'une page pour l'affichage : celui enregistré en base, ou le texte d'origine s'il n'y est pas. */
export async function textesDePage<P extends PageTextes>(page: P): Promise<TextesDe<P>> {
  const textes: Record<string, string> = Object.fromEntries(Object.entries(TEXTES_PAR_DEFAUT[page]).map(([cle, { texte }]) => [cle, texte]));
  for (const { cle, texte } of await prisma.textePage.findMany({ where: { page }, select: { cle: true, texte: true } })) {
    if (Object.hasOwn(textes, cle)) textes[cle] = texte;
  }
  return textes as TextesDe<P>;
}
