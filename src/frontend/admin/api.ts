// Appels des routes /api depuis l'interface admin (cookie de session envoyé automatiquement).

export type Resultat<T> =
  | { ok: true; donnees: T }
  // erreursChamps : message à afficher sous chaque champ ; suggestion : autre action proposée (ex : « masquer »).
  | { ok: false; message: string; erreursChamps: Record<string, string>; suggestion?: string };

const MESSAGES_STATUT: Record<number, string> = {
  401: 'Votre session a expiré : reconnectez-vous.',
  403: 'Accès réservé à l’administration.',
};

type ErreurApi = { error?: string; details?: { champ: string; message: string }[]; suggestion?: string };

const minuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

/** Erreur claire : « Prix par personne (€) » : champ obligatoire. (`libelles` traduit les noms de champs). */
function echec(statut: number, corps: ErreurApi, libelles: Record<string, string>): Resultat<never> {
  const details = corps.details ?? [];
  // Première erreur de chaque champ (ex : « Champ obligatoire. » avant « Format invalide. »).
  const erreursChamps = Object.fromEntries(details.toReversed().map(d => [d.champ, d.message]));
  const [premier] = details;
  const autres = details.length > 1 ? ` (et ${details.length - 1} autre${details.length > 2 ? 's' : ''} champ${details.length > 2 ? 's' : ''} à corriger)` : '';
  const message = MESSAGES_STATUT[statut]
    ?? (premier && libelles[premier.champ] ? `« ${libelles[premier.champ]} » : ${minuscule(premier.message)}${autres}` : corps.error ?? 'Une erreur est survenue. Réessayez.');
  return { ok: false, message, erreursChamps, suggestion: corps.suggestion };
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
    return reponse.ok ? { ok: true, donnees: donnees as T } : echec(reponse.status, donnees as ErreurApi, libelles);
  } catch {
    return { ok: false, message: 'Connexion impossible. Vérifiez votre réseau et réessayez.', erreursChamps: {} };
  }
}
