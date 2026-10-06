import Link from "next/link";
import { prisma } from "@/backend/db/prisma";
import { getStripe } from "@/backend/payments/stripe";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string }> };

const formatPrix = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function ReservationSucces({ searchParams }: Props) {
  const { session_id } = await searchParams;

  const reservation = session_id
    ? await prisma.reservation.findUnique({
        where: { stripeSessionId: session_id },
        include: { session: { include: { experience: true } } },
      })
    : null;

  if (!reservation) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Réservation introuvable</h1>
        <p className="mt-4">
          Nous ne retrouvons pas cette réservation. Si vous avez été débité, écrivez-nous à
          larecette@ecomail.fr avec l’adresse e-mail utilisée.
        </p>
        <Link href="/experiences" className="mt-8 inline-block underline">
          Voir les expériences
        </Link>
      </main>
    );
  }

  // Le webhook peut arriver quelques secondes après la redirection :
  // on vérifie alors directement auprès de Stripe.
  let paye = reservation.statut === "payee";
  if (!paye && reservation.statut === "en_attente" && session_id) {
    try {
      const checkout = await getStripe().checkout.sessions.retrieve(session_id);
      paye = checkout.payment_status === "paid";
    } catch {
      // On garde le statut de la base
    }
  }

  const { session } = reservation;
  const date = session.dateDebut.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const heure = session.dateDebut.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold">
        {paye ? "Votre place est réservée" : "Paiement en cours de vérification"}
      </h1>

      <p className="mt-4">
        {paye
          ? `Merci ${reservation.nom}. Un e-mail de confirmation va vous être envoyé.`
          : "Votre paiement est en cours de traitement. Rechargez cette page dans quelques instants."}
      </p>

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t pt-6">
        <dt className="font-medium">Expérience</dt>
        <dd>{session.experience.titre}</dd>
        <dt className="font-medium">Date</dt>
        <dd>
          {date} à {heure}
        </dd>
        <dt className="font-medium">Lieu</dt>
        <dd>{session.lieu}</dd>
        <dt className="font-medium">Participants</dt>
        <dd>{reservation.nbPersonnes}</dd>
        <dt className="font-medium">Montant</dt>
        <dd>{formatPrix(reservation.montantCents)}</dd>
      </dl>

      <Link href="/experiences" className="mt-10 inline-block underline">
        Découvrir les autres expériences
      </Link>
    </main>
  );
}
