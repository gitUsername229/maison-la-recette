'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { appelerApi } from '@/frontend/api';
import Champ from '@/frontend/components/Champ';
import { classeErreur, classeGrandBouton } from '@/frontend/styles/classes';

/**
 * Saisie du mot de passe du tableau de bord (un seul champ). Accepté, le serveur pose le cookie d'accès et la page
 * se recharge avec les chiffres. `configure` : faux tant que le mot de passe et le secret manquent dans .env.local.
 */
export default function ConnexionTableauDeBord({ configure }: { configure: boolean }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function entrer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const motDePasse = String(new FormData(event.currentTarget).get('motDePasse') ?? '');
    setEnvoi(true);
    const resultat = await appelerApi('/api/tableau-de-bord/connexion', { methode: 'POST', corps: { motDePasse } });
    setEnvoi(false);
    if (!resultat.ok) return setErreur(resultat.erreursChamps.motDePasse ?? resultat.message);
    setErreur(null);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12 lg:py-16">
      <h1 className="font-titre text-4xl text-titre">Tableau de bord</h1>
      <p className="mt-3">Espace privé de Maison La recette.</p>
      {configure ? (
        <form onSubmit={entrer} className="mt-6 grid gap-4 rounded-2xl bg-fond p-5">
          <Champ libelle="Mot de passe" name="motDePasse" type="password" autoComplete="current-password" required maxLength={200} erreur={erreur ?? undefined} />
          <button type="submit" disabled={envoi} className={`${classeGrandBouton.primaire} disabled:opacity-60`}>{envoi ? 'Vérification…' : 'Entrer'}</button>
        </form>
      ) : (
        <p role="alert" className={`mt-6 ${classeErreur}`}>
          Le tableau de bord n’est pas encore configuré : il faut définir TABLEAU_DE_BORD_MOT_DE_PASSE et
          TABLEAU_DE_BORD_SECRET (32 caractères au moins) dans .env.local, puis redémarrer le serveur.
        </p>
      )}
    </main>
  );
}
