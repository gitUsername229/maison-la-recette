"use client";

import { useState } from "react";

export type SessionDisponible = {
  id: number;
  dateDebut: string; // ISO
  lieu: string;
  placesRestantes: number;
  prixCents: number;
};

type Props = { sessions: SessionDisponible[] };

const formatPrix = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

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

  async function reserver() {
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
    <div className="grid max-w-md gap-4">
      <label className="grid gap-1">
        <span className="font-medium">Date</span>
        <select
          className="rounded border px-3 py-2"
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

      <label className="grid gap-1">
        <span className="font-medium">Nombre de participants</span>
        <input
          type="number"
          min={1}
          max={maxPlaces}
          className="rounded border px-3 py-2"
          value={nbPersonnes}
          onChange={(e) =>
            setNbPersonnes(Math.min(maxPlaces, Math.max(1, Number(e.target.value) || 1)))
          }
        />
      </label>

      <label className="grid gap-1">
        <span className="font-medium">Nom</span>
        <input
          type="text"
          autoComplete="name"
          className="rounded border px-3 py-2"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
      </label>

      <label className="grid gap-1">
        <span className="font-medium">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="grid gap-1">
        <span className="font-medium">Téléphone (facultatif)</span>
        <input
          type="tel"
          autoComplete="tel"
          className="rounded border px-3 py-2"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />
      </label>

      <p className="text-lg">
        Total : <strong>{formatPrix(total)}</strong>
      </p>

      {erreur && (
        <p role="alert" className="text-red-700">
          {erreur}
        </p>
      )}

      <button
        type="button"
        onClick={reserver}
        disabled={envoi}
        className="rounded bg-black px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {envoi ? "Redirection vers le paiement…" : `Réserver et payer ${formatPrix(total)}`}
      </button>
    </div>
  );
}
