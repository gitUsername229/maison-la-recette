import type { Metadata } from "next";
import Link from "next/link";
import { reservationApresPaiement } from "@/backend/ateliers/bookings";
import { EMAIL_DE_CONTACT } from "@/backend/site";
import { formatDateHeure, formatPrix } from "@/frontend/format";

export const metadata: Metadata = { title: "Réservation | Maison La recette", robots: { index: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

const SI_DEBITE = `Si vous avez été débité, écrivez-nous à ${EMAIL_DE_CONTACT} avec l’adresse e-mail utilisée.`;

export default async function ReservationSucces({ searchParams }: Props) {
  const { session_id } = await searchParams;
  // Sans compte : la réservation n'est montrée que si Stripe confirme que cette session de paiement la désigne.
  const resultat = session_id ? await reservationApresPaiement(session_id) : ({ refus: "introuvable" } as const);

  if ("refus" in resultat) {
    const indisponible = resultat.refus === "indisponible";
    return (
      <main className="mx-auto max-w-xl px-5 py-8 lg:px-6 lg:py-12">
        <h1 className="text-3xl font-bold lg:text-4xl">{indisponible ? "Vérification en cours" : "Réservation introuvable"}</h1>
        <p className="mt-4">
          {indisponible
            ? "Nous n’arrivons pas à vérifier votre paiement pour le moment. Rechargez cette page dans un instant."
            : "Nous ne retrouvons pas cette réservation."}{" "}
          {SI_DEBITE}
        </p>
        <Link href="/experiences" className="mt-8 inline-block underline">
          Voir les expériences
        </Link>
      </main>
    );
  }

  const { reservation } = resultat;
  const { session } = reservation;
  const paye = reservation.statut === "payee";

  return (
    <main className="mx-auto max-w-xl px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="text-3xl font-bold lg:text-4xl">
        {paye ? "Votre place est réservée" : "Paiement en cours de vérification"}
      </h1>

      <p className="mt-4">
        {paye
          ? "Merci ! Un e-mail de confirmation vous est envoyé avec ce récapitulatif. Une question ? Répondez simplement à cet e-mail."
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
        <dt className="font-medium">Réservation</dt>
        <dd>n° {reservation.id}</dd>
      </dl>

      <p className="mt-8 text-sm text-texte-doux">Pour toute question : {EMAIL_DE_CONTACT}</p>

      <div className="mt-10 flex flex-wrap gap-6">
        <Link href={`/experiences/${session.experience.slug}`} className="underline">Revoir l’expérience</Link>
        <Link href="/experiences" className="underline">Découvrir les autres expériences</Link>
      </div>
    </main>
  );
}
