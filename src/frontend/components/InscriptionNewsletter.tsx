'use client';

import { useState } from 'react';
import { CaseConsentement, ChampPiege } from '@/frontend/components/Champ';
import { classeBouton, classeChamp } from '@/frontend/styles/classes';

/** Inscription à la newsletter (accueil) ; titre, texte et bouton modifiables dans /admin/textes. */
export default function InscriptionNewsletter({ titre, texte, bouton }: { titre: string; texte: string; bouton: string }) {
  const [etat, setEtat] = useState<{ erreur: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function inscrire(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulaire = event.currentTarget;
    const champs = new FormData(formulaire);
    const piege = String(champs.get('siteWeb') ?? '').trim();
    setEnvoi(true);
    const reponse = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(champs.get('email')).trim(), consentement: champs.get('consentement') === 'on', ...(piege ? { siteWeb: piege } : {}) }),
    }).catch(() => null);
    const donnees = await reponse?.json().catch(() => ({}));
    setEnvoi(false);
    // Erreur : le message du serveur (adresse invalide, case non cochée, trop d'envois), ou l'absence de réseau.
    if (!reponse?.ok) return setEtat({ erreur: true, texte: reponse ? (donnees?.details?.[0]?.message ?? donnees?.error ?? 'Adresse e-mail invalide.') : 'Connexion impossible. Réessayez.' });
    formulaire.reset();
    setEtat({ erreur: false, texte: donnees.message });
  }

  return (
    <section className="mt-14 rounded-3xl bg-pastel-chaud p-7 sm:p-10">
      <h2 className="font-serif text-3xl">{titre}</h2>
      <p className="mt-2 whitespace-pre-line">{texte}</p>
      <form onSubmit={inscrire} className="relative mt-5 grid gap-3">
        <ChampPiege />
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Adresse e-mail</span>
            <input name="email" type="email" required autoComplete="email" placeholder="Votre adresse e-mail" className={classeChamp} />
          </label>
          <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Inscription…' : bouton}</button>
        </div>
        <CaseConsentement usage="pour recevoir la newsletter" />
      </form>
      {/* Sur le fond coloré, le message reste couleur texte (contraste AA) ; son texte dit s'il s'agit d'une erreur. */}
      {etat && <p role="status" className="mt-3 text-sm font-bold">{etat.texte}</p>}
    </section>
  );
}
