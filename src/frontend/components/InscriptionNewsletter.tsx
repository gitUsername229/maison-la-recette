'use client';

import { useState } from 'react';
import { classeBouton, classeChamp } from '@/frontend/styles/classes';

/** Inscription à la newsletter (accueil) ; titre, texte et bouton modifiables dans /admin/textes. */
export default function InscriptionNewsletter({ titre, texte, bouton }: { titre: string; texte: string; bouton: string }) {
  const [etat, setEtat] = useState<{ erreur: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function inscrire(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulaire = event.currentTarget;
    setEnvoi(true);
    const reponse = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(new FormData(formulaire).get('email')).trim() }),
    }).catch(() => null);
    const donnees = await reponse?.json().catch(() => ({}));
    setEnvoi(false);
    if (!reponse?.ok) return setEtat({ erreur: true, texte: reponse ? 'Adresse e-mail invalide.' : 'Connexion impossible. Réessayez.' });
    formulaire.reset();
    setEtat({ erreur: false, texte: donnees.message });
  }

  return (
    <section className="mt-14 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <h2 className="font-serif text-2xl">{titre}</h2>
      <p className="mt-2 whitespace-pre-line text-stone-600">{texte}</p>
      <form onSubmit={inscrire} className="mt-4 flex flex-wrap gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Adresse e-mail</span>
          <input name="email" type="email" required autoComplete="email" placeholder="Votre adresse e-mail" className={classeChamp} />
        </label>
        <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Inscription…' : bouton}</button>
      </form>
      {etat && <p role="status" className={`mt-3 text-sm ${etat.erreur ? 'text-red-700' : 'text-emerald-800'}`}>{etat.texte}</p>}
    </section>
  );
}
