import 'server-only';
import { prisma } from '@/backend/db/prisma';

/** Photos de la galerie d'une page du site, dans l'ordre enregistré. */
export function imagesDePage(page: string) {
  return prisma.image.findMany({ where: { page }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }] });
}
