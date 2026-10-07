import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { redirectionRefus, verifierAcces, type Utilisateur } from './acces';

// Pages serveur : même contrôle que les routes API (verifierAcces), mais avec
// une redirection au lieu d'une erreur JSON.

/** Admin connecté pour la requête en cours, ou null. Une seule lecture par affichage. */
export const adminConnecte = cache(async (): Promise<Utilisateur | null> => {
  const verdict = await verifierAcces(await headers(), 'admin');
  return 'utilisateur' in verdict ? verdict.utilisateur : null;
});

/** Protège une page de l'administration : connexion et rôle admin vérifiés côté serveur à chaque affichage. */
export async function exigerAdminPage(chemin: string): Promise<Utilisateur> {
  const verdict = await verifierAcces(await headers(), 'admin');
  if ('utilisateur' in verdict) return verdict.utilisateur;
  redirect(redirectionRefus(verdict.refus, chemin));
}
