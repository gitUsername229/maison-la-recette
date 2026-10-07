/** Chemin interne sûr pour ?retour= : refuse les liens vers un autre site. */
export function cheminDeRetour(valeur: string | null | undefined, defaut = '/admin'): string {
  if (!valeur || !valeur.startsWith('/') || valeur.startsWith('//') || valeur.startsWith('/\\')) return defaut;
  return valeur;
}
