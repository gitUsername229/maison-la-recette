import { NextResponse } from "next/server";
import { requireAdmin } from "@/backend/auth/admin";
import { prisma } from "@/backend/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/reservations?session_id=cs_test_...
 *   Public : retrouve UNE réservation après le paiement (page de succès).
 *   Ne renvoie que des informations non sensibles.
 *
 * GET /api/reservations[?statut=payee]
 *   Admin : liste toutes les réservations (header x-admin-key obligatoire).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stripeSessionId = searchParams.get("session_id");

  // Accès public, limité à une réservation précise
  if (stripeSessionId) {
    const reservation = await prisma.reservation.findUnique({
      where: { stripeSessionId },
      include: { session: { include: { experience: true } } },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      id: reservation.id,
      nom: reservation.nom,
      nbPersonnes: reservation.nbPersonnes,
      montantCents: reservation.montantCents,
      statut: reservation.statut,
      session: {
        dateDebut: reservation.session.dateDebut,
        lieu: reservation.session.lieu,
        experience: reservation.session.experience.titre,
      },
    });
  }

  // Accès admin
  const refus = requireAdmin(req);
  if (refus) return refus;

  const statut = searchParams.get("statut");
  const reservations = await prisma.reservation.findMany({
    where: statut ? { statut } : undefined,
    include: { session: { include: { experience: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}
