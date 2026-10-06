'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient, messageErreurAuth } from '@/frontend/auth-client';
import Champ from '@/frontend/components/Champ';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';

const LIEN_INVALIDE = 'Ce lien n’est plus valable (il expire au bout d’1 heure et ne sert qu’une fois).';

export default function ReinitialiserMotDePasse({ token }: { token: string | null }) {
  const [termine, setTermine] = useState(false);
  const [erreur, setErreur] = useState<string | null>(token ? null : LIEN_INVALIDE);
  const [envoi, setEnvoi] = useState(false);

  async function changer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const donnees = new FormData(event.currentTarget);
    const motDePasse = String(donnees.get('motDePasse'));
    if (motDePasse !== String(donnees.get('confirmation'))) return setErreur('Les deux mots de passe ne sont pas identiques.');
    setErreur(null);
    setEnvoi(true);
    const { error } = await authClient.resetPassword({ newPassword: motDePasse, token: token ?? '' });
    setEnvoi(false);
    if (error) return setErreur(error.code === 'INVALID_TOKEN' ? LIEN_INVALIDE : messageErreurAuth(error));
    setTermine(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
      <h1 className="font-serif text-4xl">Nouveau mot de passe</h1>
      {termine ? (
        <>
          <p className="mt-4 leading-relaxed text-stone-600">Votre mot de passe est changé. Par sécurité, vos autres connexions ont été fermées.</p>
          <Link href="/connexion" className={`mt-8 inline-block ${classeBouton}`}>Se connecter</Link>
        </>
      ) : (
        <form onSubmit={changer} className="mt-8 grid gap-4">
          {token && (
            <>
              <Champ libelle="Nouveau mot de passe" name="motDePasse" type="password" autoComplete="new-password" required minLength={8} aide="8 caractères minimum." />
              <Champ libelle="Confirmer le mot de passe" name="confirmation" type="password" autoComplete="new-password" required minLength={8} />
            </>
          )}
          {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
          {token ? (
            <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Enregistrement…' : 'Changer le mot de passe'}</button>
          ) : (
            <Link href="/mot-de-passe-oublie" className="text-sm underline">Recevoir un nouveau lien</Link>
          )}
        </form>
      )}
    </main>
  );
}
