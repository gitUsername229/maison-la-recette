'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient, messageErreurAuth } from '@/frontend/auth-client';
import Champ from '@/frontend/components/Champ';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';

export default function MotDePasseOublie() {
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function demander(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const { error } = await authClient.requestPasswordReset({
      email: String(new FormData(event.currentTarget).get('email')).trim(),
      redirectTo: '/reinitialiser-mot-de-passe',
    });
    setEnvoi(false);
    // Même réponse qu'un compte existe ou non : seule une limite de tentatives est signalée.
    if (error?.status === 429) return setErreur(messageErreurAuth(error));
    setEnvoye(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
      <h1 className="font-serif text-4xl">Mot de passe oublié</h1>
      {envoye ? (
        <p className="mt-4 leading-relaxed text-stone-600">
          Si un compte existe pour cette adresse, un e-mail vient de partir avec un lien pour choisir un nouveau mot de passe. Il est valable 1 heure.
        </p>
      ) : (
        <>
          <p className="mt-3 leading-relaxed text-stone-600">Indiquez l’adresse de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
          <form onSubmit={demander} className="mt-8 grid gap-4">
            <Champ libelle="E-mail" name="email" type="email" autoComplete="email" required />
            {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
            <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Envoi…' : 'Recevoir le lien'}</button>
          </form>
        </>
      )}
      <Link href="/connexion" className="mt-6 inline-block text-sm underline">Retour à la connexion</Link>
    </main>
  );
}
