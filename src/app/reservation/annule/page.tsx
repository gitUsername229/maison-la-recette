import Link from "next/link";

// Page d'information seulement : elle n'annule rien. Les places bloquées sont
// libérées quand Stripe confirme l'expiration du paiement (webhook), ou par l'admin.
export default function ReservationAnnulee() {
  return (
    <main className="mx-auto max-w-xl px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="text-3xl font-bold lg:text-4xl">Paiement annulé</h1>
      <p className="mt-4">
        Aucun montant n’a été débité et votre réservation n’a pas été enregistrée. Vous pouvez
        choisir une autre date ou réessayer.
      </p>
      <Link href="/experiences" className="mt-8 inline-block underline">
        Revenir aux expériences
      </Link>
    </main>
  );
}
