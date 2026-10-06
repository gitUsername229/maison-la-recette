import 'server-only';
import type { Prisma } from '@prisma/client';

// Durée pendant laquelle des places restent bloquées pendant le paiement.
// 35 minutes laissent une marge au-dessus du minimum Stripe de 30 minutes.
export const DUREE_BLOCAGE_MS = 35 * 60 * 1000;

/**
 * Places encore disponibles sur une session :
 * places totales - places payées - places en cours de paiement.
 * Seule une confirmation Stripe libère un paiement expiré, jamais l'horloge locale.
 * Évite de vendre deux fois la dernière place.
 */
export async function placesDisponibles(
  db: Prisma.TransactionClient,
  sessionId: number
): Promise<number> {
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session) return 0;

  const enCours = await db.reservation.aggregate({
    _sum: { nbPersonnes: true },
    where: {
      sessionId,
      statut: 'en_attente',
    },
  });

  return Math.max(0, session.placesTotal - session.placesPrises - (enCours._sum.nbPersonnes ?? 0));
}
