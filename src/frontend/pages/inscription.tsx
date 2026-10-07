'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient, messageErreurAuth } from '@/frontend/auth-client';
import Champ from '@/frontend/components/Champ';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';

export default function Inscription({ retour }: { retour: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function inscrire(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const donnees = new FormData(event.currentTarget);
    const telephone = String(donnees.get('telephone')).trim();
    setErreur(null);
    setEnvoi(true);
    const { error } = await authClient.signUp.email({
      name: String(donnees.get('nom')).trim(),
      email: String(donnees.get('email')).trim(),
      password: String(donnees.get('motDePasse')),
      callbackURL: '/compte', // page ouverte après le clic sur le lien de vérification
      ...(telephone ? { telephone } : {}),
    });
    if (error) {
      setErreur(messageErreurAuth(error));
      setEnvoi(false);
      return;
    }
    router.replace(retour);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
      <h1 className="font-serif text-4xl">Créer un compte</h1>
      <p className="mt-3 leading-relaxed text-texte-doux">Pour réserver une expérience, demander un devis et retrouver vos demandes.</p>
      <form onSubmit={inscrire} className="mt-8 grid gap-4">
        <Champ libelle="Nom et prénom" name="nom" autoComplete="name" required maxLength={120} />
        <Champ libelle="E-mail" name="email" type="email" autoComplete="email" required />
        <Champ libelle="Téléphone (facultatif)" name="telephone" type="tel" autoComplete="tel" maxLength={40} />
        <Champ libelle="Mot de passe" name="motDePasse" type="password" autoComplete="new-password" required minLength={8} aide="8 caractères minimum." />
        {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
        <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="mt-6 text-sm text-texte-doux">
        Déjà un compte ? <Link href={`/connexion?retour=${encodeURIComponent(retour)}`} className="underline">Se connecter</Link>
      </p>
    </main>
  );
}
