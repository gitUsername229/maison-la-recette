"use client";

import { useState } from "react";
import { formatPrix } from "@/frontend/format";

export type SessionDisponible = {
  id: number;
  dateDebut: string; // ISO
  lieu: string;
  placesRestantes: number;
  prixCents: number;
};

type Props = { sessions: SessionDisponible[] };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ReservationForm({ sessions }: Props) {
  const ouvertes = sessions.filter((s) => s.placesRestantes > 0);

  const [sessionId, setSessionId] = useState<number | "">(ouvertes[0]?.id ?? "");
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
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

  async function reserver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    if (!nom.trim() || !email.trim()) {
      setErreur("Indiquez votre nom et votre adresse e-mail.");
      return;
    }

    setEnvoi(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, nbPersonnes, nom, email, telephone }),
      });
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
      <label className="grid min-w-0 gap-1">
        <span className="text-sm font-medium">Date</span>
        <select
          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          value={sessionId}
          onChange={(e) => {
            setSessionId(Number(e.target.value));
            setNbPersonnes(1);
          }}
        >
          {ouvertes.map((s) => (
            <option key={s.id} value={s.id}>
              {formatDate(s.dateDebut)}, {s.lieu} ({s.placesRestantes} place
              {s.placesRestantes > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1">
        <span className="text-sm font-medium">Nombre de participants</span>
        <input
          type="number"
          min={1}
          max={maxPlaces}
          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          value={nbPersonnes}
          onChange={(e) =>
            setNbPersonnes(Math.min(maxPlaces, Math.max(1, Number(e.target.value) || 1)))
          }
        />
      </label>

      <label className="grid min-w-0 gap-1">
        <span className="text-sm font-medium">Nom</span>
        <input
          type="text"
          autoComplete="name"
          required
          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
      </label>

      <label className="grid min-w-0 gap-1">
        <span className="text-sm font-medium">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="grid min-w-0 gap-1">
        <span className="text-sm font-medium">Téléphone (facultatif)</span>
        <input
          type="tel"
          autoComplete="tel"
          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />
      </label>

      <p className="flex items-baseline justify-between border-t border-stone-200 pt-4">
        <span className="text-stone-600">Total</span>
        <strong className="text-xl">{formatPrix(total)}</strong>
      </p>

      {erreur && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={envoi}
        className="w-full rounded-full bg-encre px-5 py-3.5 font-medium text-creme transition hover:bg-black disabled:opacity-60"
      >
        {envoi ? "Redirection vers le paiement…" : `Réserver et payer ${formatPrix(total)}`}
      </button>
    </form>
  );
}
