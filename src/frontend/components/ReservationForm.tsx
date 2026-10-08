"use client";

import { useState } from "react";
import { appelerApi } from "@/frontend/api";
import Champ, { CaseConsentement, ChampPiege } from "@/frontend/components/Champ";
import { formatDateHeure, formatPrix } from "@/frontend/format";
import { classeBouton, classeChamp, classeErreur, classeLibelle } from "@/frontend/styles/classes";

export type SessionDisponible = {
  id: number;
  dateDebut: string; // ISO
  lieu: string;
  placesRestantes: number;
  prixCents: number;
};

// Noms des champs dans les messages d'erreur renvoyés par /api/checkout.
const LIBELLES = { nom: "Nom et prénom", email: "E-mail", telephone: "Téléphone", nbPersonnes: "Nombre de participants", consentement: "Politique de confidentialité" };

/** Réservation sans compte : coordonnées saisies ici, puis paiement sur la page Stripe. */
export default function ReservationForm({ sessions }: { sessions: SessionDisponible[] }) {
  const ouvertes = sessions.filter((s) => s.placesRestantes > 0);

  const [sessionId, setSessionId] = useState<number | "">(ouvertes[0]?.id ?? "");
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreursChamps, setErreursChamps] = useState<Record<string, string>>({});
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
    const formulaire = new FormData(event.currentTarget);
    const texte = (champ: string) => String(formulaire.get(champ) ?? "").trim();
    setErreur(null);
    setErreursChamps({});
    setEnvoi(true);
    const resultat = await appelerApi<{ checkoutUrl: string }>("/api/checkout", {
      methode: "POST",
      corps: {
        sessionId, nbPersonnes, nom: texte("nom"), email: texte("email"),
        ...(texte("telephone") ? { telephone: texte("telephone") } : {}),
        consentement: formulaire.get("consentement") === "on",
        ...(texte("siteWeb") ? { siteWeb: texte("siteWeb") } : {}),
      },
      libelles: LIBELLES,
    });
    if (!resultat.ok) {
      setErreur(resultat.message);
      setErreursChamps(resultat.erreursChamps);
      setEnvoi(false);
      return;
    }
    // Redirection vers la page de paiement Stripe
    window.location.href = resultat.donnees.checkoutUrl;
  }

  return (
    <form onSubmit={reserver} className="relative grid gap-4">
      <ChampPiege />
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

      <Champ libelle="Nom et prénom" name="nom" autoComplete="name" required maxLength={120} erreur={erreursChamps.nom} />
      <Champ libelle="E-mail" name="email" type="email" autoComplete="email" required maxLength={254} aide="La confirmation et le récapitulatif y sont envoyés." erreur={erreursChamps.email} />
      <Champ libelle="Téléphone (facultatif)" name="telephone" type="tel" autoComplete="tel" minLength={6} maxLength={40} aide="Pour vous prévenir en cas d’imprévu." erreur={erreursChamps.telephone} />

      <CaseConsentement usage="pour ma réservation" erreur={erreursChamps.consentement} />

      <p className="flex items-baseline justify-between border-t border-bordure pt-4">
        <span className="text-texte-doux">Total</span>
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
