import 'server-only';
import type { Prisma } from '@prisma/client';

// Durée de validité du paiement Stripe (expires_at de la session Checkout).
// 35 minutes laissent une marge au-dessus du minimum Stripe de 30 minutes.
export const DUREE_BLOCAGE_MS = 35 * 60 * 1000;

// Marge pour un éventuel écart d'horloge entre le serveur et Stripe.
const MARGE_HORLOGE_MS = 2 * 60 * 1000;

/**
 * Réservations en attente qui bloquent encore des places : leur paiement Stripe peut encore aboutir.
 * Passé l'expiration (+ marge), Stripe refuse le paiement : les places sont libérées même si
 * l'événement checkout.session.expired n'est jamais arrivé (stripe listen coupé, panne…).
 */
export function reservationsBloquantes(sessionId?: number): Prisma.ReservationWhereInput {
  const limite = new Date(Date.now() - DUREE_BLOCAGE_MS - MARGE_HORLOGE_MS);
  return { ...(sessionId === undefined ? {} : { sessionId }), statut: 'en_attente', createdAt: { gt: limite } };
}

/** Places bloquées par des paiements encore en cours sur une session. */
export async function placesBloquees(db: Prisma.TransactionClient, sessionId: number): Promise<number> {
  const somme = await db.reservation.aggregate({ where: reservationsBloquantes(sessionId), _sum: { nbPersonnes: true } });
  return somme._sum.nbPersonnes ?? 0;
}

/**
 * Places encore disponibles sur une session :
 * places totales - places payées - places en cours de paiement.
 * Évite de vendre deux fois la dernière place.
 */
export async function placesDisponibles(db: Prisma.TransactionClient, sessionId: number): Promise<number> {
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session) return 0;
  return Math.max(0, session.placesTotal - session.placesPrises - await placesBloquees(db, sessionId));
}
