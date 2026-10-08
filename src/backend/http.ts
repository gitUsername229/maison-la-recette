import 'server-only';
import { ZodError, type z } from 'zod';

/**
 * Erreur métier renvoyée telle quelle à l'interface. `champ` désigne le champ à corriger (message affiché
 * sous ce champ).
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public options: { champ?: string } = {}) { super(message); }
}

/** Message en français simple pour un champ refusé par zod (les messages écrits en français dans les schémas sont gardés). */
function messageValidation(issue: z.core.$ZodIssue): string {
  if (!/^(Invalid|Too |Unrecognized|Expected)/.test(issue.message)) return issue.message;
  switch (issue.code) {
    case 'invalid_type': return issue.message.includes('undefined') ? 'Champ obligatoire.' : 'Valeur invalide.';
    case 'too_small': return issue.origin === 'string' ? (Number(issue.minimum) <= 1 ? 'Champ obligatoire.' : `Au moins ${issue.minimum} caractères.`) : `Doit être au moins ${issue.minimum}.`;
    case 'too_big': return issue.origin === 'string' ? `${issue.maximum} caractères maximum.` : `Doit être au plus ${issue.maximum}.`;
    case 'invalid_format': return issue.format === 'email' ? 'Adresse e-mail invalide.' : issue.format === 'url' ? 'Lien invalide : il doit commencer par https://' : 'Format invalide.';
    case 'invalid_value': return 'Choix invalide.';
    case 'unrecognized_keys': return `Champ non accepté : ${issue.keys.join(', ')}.`;
    default: return 'Valeur invalide.';
  }
}

export function endpoint<T extends unknown[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) {
      if (error instanceof ApiError) {
        const { champ } = error.options;
        return json({ error: error.message, ...(champ ? { details: [{ champ, message: error.message }] } : {}) }, error.status);
      }
      if (error instanceof ZodError) return json({ error: 'Vérifiez les champs signalés.', details: error.issues.map(i => ({ champ: i.path.join('.'), message: messageValidation(i) })) }, 400);
      if (error instanceof SyntaxError) return json({ error: 'JSON invalide' }, 400);
      console.error('Erreur API', error instanceof Error ? error.name : 'Erreur inconnue');
      return json({ error: 'Un problème technique est survenu. Réessayez dans un instant ; si cela recommence, prévenez la personne qui s’occupe du site.' }, 500);
    }
  };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
