"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateHeure, formatPrix } from "@/frontend/format";
import { classeBouton, classeChamp, classeErreur, classeLibelle } from "@/frontend/styles/classes";

export type SessionDisponible = {
  id: number;
  dateDebut: string; // ISO
  lieu: string;
  placesRestantes: number;
  prixCents: number;
};

type Props = {
  sessions: SessionDisponible[];
  // Nom et e-mail de la réservation : ceux du compte connecté (le serveur les relit lui-même).
  utilisateur: { nom: string; email: string };
};

export default function ReservationForm({ sessions, utilisateur }: Props) {
  const router = useRouter();
  const ouvertes = sessions.filter((s) => s.placesRestantes > 0);

  const [sessionId, setSessionId] = useState<number | "">(ouvertes[0]?.id ?? "");
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const choisie = ouvertes.find((s) => s.id === sessionId);
  const maxPlaces = choisie?.placesRestantes ?? 1;
  const total = choisie ? choisie.prixCents * nbPersonnes : 0;

  if (ouvertes.length === 0) {
    return (
      <p>
        Aucune date n’est ouverte pour le moment. Pour un groupe ou une entreprise, demandez un
        devis depuis la page Contact.
      </p>
    );
  }

  async function reserver(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, nbPersonnes }),
      });
      // Session expirée entre-temps : retour à la connexion, puis à cette page.
      if (res.status === 401) {
        router.push(`/connexion?retour=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        setErreur(data.error ?? "Le paiement n'a pas pu être lancé. Réessayez.");
        setEnvoi(false);
        return;
      }

      // Redirection vers la page de paiement Stripe
      window.location.href = data.checkoutUrl;
    } catch {
      setErreur("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={reserver} className="grid gap-4">
      <label className={classeLibelle}>
        <span className="text-sm font-medium">Date</span>
        <select
          className={classeChamp}
          value={sessionId}
          onChange={(e) => {
            setSessionId(Number(e.target.value));
            setNbPersonnes(1);
          }}
        >
          {ouvertes.map((s) => (
            <option key={s.id} value={s.id}>
              {formatDateHeure(s.dateDebut)}, {s.lieu} ({s.placesRestantes} place
              {s.placesRestantes > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </label>

      <label className={classeLibelle}>
        <span className="text-sm font-medium">Nombre de participants</span>
        <input
          type="number"
          min={1}
          max={maxPlaces}
          className={classeChamp}
          value={nbPersonnes}
          onChange={(e) =>
            setNbPersonnes(Math.min(maxPlaces, Math.max(1, Number(e.target.value) || 1)))
          }
        />
      </label>

      <p className="text-sm text-stone-600">
        Réservation au nom de <strong className="text-stone-800">{utilisateur.nom}</strong> ({utilisateur.email}).
      </p>

      <p className="flex items-baseline justify-between border-t border-stone-200 pt-4">
        <span className="text-stone-600">Total</span>
        <strong className="text-xl">{formatPrix(total)}</strong>
      </p>

      {erreur && (
        <p role="alert" className={classeErreur}>
          {erreur}
        </p>
      )}

      <button type="submit" disabled={envoi} className={`w-full ${classeBouton}`}>
        {envoi ? "Redirection vers le paiement…" : `Réserver et payer ${formatPrix(total)}`}
      </button>
    </form>
  );
}
