import 'server-only';
import type { Prisma } from '@prisma/client';

// Durée pendant laquelle des places restent bloquées pendant le paiement.
// 30 minutes = durée minimale d'expiration d'une session Stripe Checkout.
export const DUREE_BLOCAGE_MS = 30 * 60 * 1000;

/**
 * Places encore disponibles sur une session :
 * places totales - places payées - places en cours de paiement (moins de 30 min).
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
      createdAt: { gt: new Date(Date.now() - DUREE_BLOCAGE_MS) },
    },
  });

  return session.placesTotal - session.placesPrises - (enCours._sum.nbPersonnes ?? 0);
}
