import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { verifierAcces, type Role, type Utilisateur } from './acces';

// Pages serveur : même contrôle que les routes API (verifierAcces), mais avec
// une redirection au lieu d'une erreur JSON.

/** Utilisateur de la requête en cours, ou null. Une seule lecture par affichage. */
export const utilisateurCourant = cache(async (): Promise<Utilisateur | null> => {
  const verdict = await verifierAcces(await headers());
  return 'utilisateur' in verdict ? verdict.utilisateur : null;
});

/** Protège une page : connexion requise (retour à `chemin` ensuite), et rôle admin si demandé. */
export async function exigerConnexionPage(chemin: string, role: Role = 'client'): Promise<Utilisateur> {
  const verdict = await verifierAcces(await headers(), role);
  if ('utilisateur' in verdict) return verdict.utilisateur;
  redirect(verdict.refus === 401 ? `/connexion?retour=${encodeURIComponent(chemin)}` : '/acces-refuse');
}
