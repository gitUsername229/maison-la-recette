// Appels des routes /api depuis l'interface admin (cookie de session envoyé automatiquement).

export type Resultat<T> = { ok: true; donnees: T } | { ok: false; message: string };

const MESSAGES_STATUT: Record<number, string> = {
  401: 'Votre session a expiré : reconnectez-vous.',
  403: 'Accès réservé à l’administration.',
};

type ErreurApi = { error?: string; details?: { champ: string }[] };

/** Message clair pour une réponse en erreur ; `libelles` traduit les noms de champs invalides. */
function messageErreur(statut: number, corps: ErreurApi, libelles: Record<string, string>) {
  if (MESSAGES_STATUT[statut]) return MESSAGES_STATUT[statut];
  const champs = corps.details?.map(d => libelles[d.champ] ?? d.champ);
  if (champs?.length) return `Champs à corriger : ${[...new Set(champs)].join(', ')}.`;
  return corps.error ?? 'Une erreur est survenue. Réessayez.';
}

export async function appelerApi<T>(
  url: string,
  { methode = 'GET', corps, libelles = {} }: { methode?: string; corps?: unknown; libelles?: Record<string, string> } = {},
): Promise<Resultat<T>> {
  try {
    const formulaire = corps instanceof FormData;
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      ...(corps === undefined ? {} : { body: formulaire ? corps : JSON.stringify(corps) }),
      ...(corps === undefined || formulaire ? {} : { headers: { 'Content-Type': 'application/json' } }),
    });
    const donnees = await reponse.json().catch(() => ({}));
    return reponse.ok ? { ok: true, donnees: donnees as T } : { ok: false, message: messageErreur(reponse.status, donnees as ErreurApi, libelles) };
  } catch {
    return { ok: false, message: 'Connexion impossible. Vérifiez votre réseau et réessayez.' };
  }
}
