import Link from "next/link";
import { prisma } from "@/backend/db/prisma";
import { getStripe } from "@/backend/payments/stripe";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ reservation_id?: string }> };

export default async function ReservationAnnulee({ searchParams }: Props) {
  const { reservation_id } = await searchParams;
  const id = Number(reservation_id);

  const reservation = Number.isInteger(id)
    ? await prisma.reservation.findUnique({ where: { id } })
    : null;

  // Libère tout de suite les places bloquées au lieu d'attendre 30 minutes
  if (reservation?.statut === "en_attente") {
    if (reservation.stripeSessionId) {
      try {
        await getStripe().checkout.sessions.expire(reservation.stripeSessionId);
      } catch {
        // Session déjà expirée ou terminée : rien à faire
      }
    }
    await prisma.reservation.updateMany({
      where: { id: reservation.id, statut: "en_attente" },
      data: { statut: "annulee" },
    });
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Paiement annulé</h1>
      <p className="mt-4">
        Aucun montant n’a été débité et votre réservation n’a pas été enregistrée. Vous pouvez
        choisir une autre date ou réessayer.
      </p>
      {/* Stripe ne renvoie pas l’identifiant de réservation ici : retour à la liste */}
      <Link href="/experiences" className="mt-8 inline-block underline">
        Revenir aux expériences
      </Link>
    </main>
  );
}
