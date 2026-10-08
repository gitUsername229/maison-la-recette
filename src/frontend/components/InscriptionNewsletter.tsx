'use client';

import { useState } from 'react';
import { CaseConsentement, ChampPiege } from '@/frontend/components/Champ';
import { classeGrandBouton } from '@/frontend/styles/classes';

/** Inscription à la newsletter (accueil, sur fond vert foncé) ; titre, texte et bouton modifiables dans /admin/textes. */
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
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
      <div>
        <h2 className="font-titre text-4xl">{titre}</h2>
        <p className="mt-3 whitespace-pre-line">{texte}</p>
      </div>
      <form onSubmit={inscrire} className="relative grid gap-4">
        <ChampPiege />
        <label>
          <span className="sr-only">Adresse e-mail</span>
          <input name="email" type="email" required autoComplete="email" placeholder="votre@email.fr" className="min-h-14 w-full rounded-full bg-fond-doux px-6 text-texte placeholder:text-texte-doux" />
        </label>
        <button type="submit" disabled={envoi} className={`${classeGrandBouton.primaire} disabled:opacity-60`}>{envoi ? 'Inscription…' : bouton}</button>
        <CaseConsentement usage="pour recevoir la newsletter" surFondSombre />
        {/* Le message garde la couleur du texte (contraste AA sur le vert) ; son texte dit s'il s'agit d'une erreur. */}
        {etat && <p role="status" className="text-sm font-bold">{etat.texte}</p>}
      </form>
    </div>
  );
}
