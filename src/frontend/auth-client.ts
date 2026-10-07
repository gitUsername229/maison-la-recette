import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

// Client Better Auth du navigateur, pour l'administration (les visiteurs n'ont pas de compte) : appelle /api/auth/*.
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: false, input: false },
      },
    }),
  ],
});

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou mot de passe incorrect.',
  INVALID_EMAIL: 'Adresse e-mail invalide.',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères.',
  PASSWORD_TOO_LONG: 'Le mot de passe est trop long.',
};

/** Message en français pour une erreur renvoyée par Better Auth. */
export function messageErreurAuth(erreur: { code?: string; status?: number }) {
  if (erreur.status === 429) return 'Trop de tentatives. Patientez une minute avant de réessayer.';
  return (erreur.code && MESSAGES[erreur.code]) || 'Une erreur est survenue. Réessayez.';
}
