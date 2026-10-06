import Link from "next/link";
import { exigerConnexionPage } from "@/backend/auth/acces-page";
import { reservationApresPaiement } from "@/backend/comptes/compte";
import { getStripe } from "@/backend/payments/stripe";
import { formatDateHeure, formatPrix } from "@/frontend/format";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function ReservationSucces({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const utilisateur = await exigerConnexionPage(
    session_id ? `/reservation/succes?session_id=${encodeURIComponent(session_id)}` : "/reservation/succes"
  );

  // Seul le propriétaire de la réservation (ou un admin) la voit.
  const reservation = session_id ? await reservationApresPaiement(session_id, utilisateur) : null;

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

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold">
        {paye ? "Votre place est réservée" : "Paiement en cours de vérification"}
      </h1>

      <p className="mt-4">
        {paye
          ? `Merci ${reservation.nom}. Vous retrouvez cette réservation dans « Mon compte ».`
          : "Votre paiement est en cours de traitement. Rechargez cette page dans quelques instants."}
      </p>

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t pt-6">
        <dt className="font-medium">Expérience</dt>
        <dd>{session.experience.titre}</dd>
        <dt className="font-medium">Date</dt>
        <dd>{formatDateHeure(session.dateDebut)}</dd>
        <dt className="font-medium">Lieu</dt>
        <dd>{session.lieu}</dd>
        <dt className="font-medium">Participants</dt>
        <dd>{reservation.nbPersonnes}</dd>
        <dt className="font-medium">Montant</dt>
        <dd>{formatPrix(reservation.montantCents)}</dd>
      </dl>

      <div className="mt-10 flex flex-wrap gap-6">
        <Link href="/compte" className="underline">Mon compte</Link>
        <Link href="/experiences" className="underline">Découvrir les autres expériences</Link>
      </div>
    </main>
  );
}
