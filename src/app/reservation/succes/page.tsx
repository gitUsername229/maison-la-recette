import Link from "next/link";
import { confirmerPaiementDepuisStripe } from "@/backend/ateliers/bookings";
import { exigerConnexionPage } from "@/backend/auth/acces-page";
import { reservationApresPaiement } from "@/backend/comptes/compte";
import { formatDateHeure, formatPrix } from "@/frontend/format";

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
        <h1 className="font-serif text-3xl">Réservation introuvable</h1>
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

  // Le webhook peut arriver après la redirection (ou jamais si stripe listen est coupé) :
  // on interroge Stripe et, s'il confirme le paiement, on l'enregistre comme le webhook.
  let paye = reservation.statut === "payee";
  if (!paye && reservation.statut === "en_attente" && session_id) {
    try {
      paye = await confirmerPaiementDepuisStripe(session_id);
    } catch (erreur) {
      // Stripe injoignable ou paiement incohérent : on garde le statut de la base.
      console.error("Confirmation depuis la page de succès impossible :", erreur instanceof Error ? erreur.message : erreur);
    }
  }

  const { session } = reservation;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl">
        {paye ? "Votre place est réservée" : "Paiement en cours de vérification"}
      </h1>

      <p className="mt-4">
        {paye
          ? `Merci ${reservation.nom}. Un e-mail de confirmation vous est envoyé, et vous retrouvez cette réservation dans « Mon compte ».`
          : "Votre paiement est en cours de traitement. Rechargez cette page dans quelques instants."}
      </p>

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-bordure pt-6">
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
