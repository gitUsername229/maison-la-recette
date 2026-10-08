import 'server-only';
import { z } from 'zod';
import { adresseIp } from '@/backend/adresse-ip';
import { ApiError } from '@/backend/http';

// Formulaires publics (devis, newsletter), ouverts à tous sans compte : champ piège pour les
// robots, limite d'envois par adresse IP et case de consentement obligatoire (date enregistrée).

/** Champ piège : caché aux visiteurs, rempli par les robots qui remplissent tous les champs. */
export const CHAMP_PIEGE = 'siteWeb';

/** Sépare le champ piège du reste du formulaire ; `robot` : il a été rempli. */
export function lirePiege(corps: unknown): { robot: boolean; donnees: unknown } {
  if (!corps || typeof corps !== 'object' || Array.isArray(corps) || !(CHAMP_PIEGE in corps)) return { robot: false, donnees: corps };
  const { [CHAMP_PIEGE]: piege, ...donnees } = corps as Record<string, unknown>;
  return { robot: typeof piege === 'string' ? piege.trim() !== '' : piege != null, donnees };
}

/** Case « J'accepte la politique de confidentialité » : obligatoire, devient la date du consentement. */
export const consentement = z
  .literal(true, { error: 'Cochez la case pour accepter la politique de confidentialité.' })
  .transform(() => new Date());

export type Formulaire = 'devis' | 'newsletter';

// Envois acceptés par adresse IP et par période ; réglables dans .env.local (voir .env.example).
const LIMITES: Record<Formulaire, { variable: string; defaut: number }> = {
  devis: { variable: 'LIMITE_DEVIS', defaut: 5 },
  newsletter: { variable: 'LIMITE_NEWSLETTER', defaut: 5 },
};
const PERIODE_MINUTES_PAR_DEFAUT = 10;
/** En développement, limites par défaut 20 fois plus larges : essais et démonstrations depuis la même adresse. */
const FACTEUR_DEVELOPPEMENT = 20;

function entierPositif(variable: string, defaut: number) {
  const valeur = Number(process.env[variable]);
  return Number.isInteger(valeur) && valeur > 0 ? valeur : defaut;
}

/** Limite et période en vigueur (relues à chaque appel : un changement de .env.local suffit après redémarrage). */
export function reglageLimite(formulaire: Formulaire) {
  const { variable, defaut } = LIMITES[formulaire];
  const developpement = process.env.NODE_ENV !== 'production';
  return {
    limite: entierPositif(variable, developpement ? defaut * FACTEUR_DEVELOPPEMENT : defaut),
    periodeMs: entierPositif('LIMITE_PERIODE_MINUTES', PERIODE_MINUTES_PAR_DEFAUT) * 60_000,
  };
}

// Compteurs en mémoire : remis à zéro au redémarrage, propres à chaque serveur (suffisant pour un seul serveur).
const compteurs = new Map<string, { debut: number; nombre: number }>();
const TAILLE_AVANT_MENAGE = 10_000;

/** Refuse (429) un envoi de trop depuis la même adresse IP sur la période. */
export function limiterDebit(request: Request, formulaire: Formulaire) {
  const { limite, periodeMs } = reglageLimite(formulaire);
  const maintenant = Date.now();
  const cle = `${formulaire}:${adresseIp(request.headers)}`;
  let compteur = compteurs.get(cle);
  if (!compteur || maintenant - compteur.debut >= periodeMs) {
    if (compteurs.size >= TAILLE_AVANT_MENAGE) {
      for (const [ancienne, { debut }] of compteurs) if (maintenant - debut >= periodeMs) compteurs.delete(ancienne);
    }
    compteur = { debut: maintenant, nombre: 0 };
    compteurs.set(cle, compteur);
  }
  compteur.nombre += 1;
  if (compteur.nombre > limite) {
    const minutes = Math.max(1, Math.ceil((compteur.debut + periodeMs - maintenant) / 60_000));
    throw new ApiError(429, `Trop d’envois en peu de temps depuis votre connexion. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`);
  }
}
