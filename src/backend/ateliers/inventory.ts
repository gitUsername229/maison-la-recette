import 'server-only';
import type { Prisma } from '@prisma/client';

export async function pendingSeats(tx: Prisma.TransactionClient, sessionId: number) {
  const sum = await tx.reservation.aggregate({ where: { sessionId, statut: 'en_attente' }, _sum: { nbPersonnes: true } });
  return sum._sum.nbPersonnes ?? 0;
}

// Première opération d'une transaction : prendre le verrou d'écriture SQLite
// avant de lire la disponibilité, pour sérialiser les réservations concurrentes.
export async function lockSession(tx: Prisma.TransactionClient, id: number) {
  return tx.session.update({ where: { id }, data: { placesPrises: { increment: 0 } }, include: { experience: true } });
}
