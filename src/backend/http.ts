import 'server-only';
import { Prisma } from '@prisma/client';
import { ZodError, type z } from 'zod';

/**
 * Erreur métier renvoyée telle quelle à l'interface. `champ` désigne le champ à corriger (message affiché
 * sous ce champ) ; `suggestion` propose une autre action (ex : « masquer » au lieu de supprimer).
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public options: { champ?: string; suggestion?: string } = {}) { super(message); }
}

/** « 1 réservation », « 3 réservations » */
export const pluriel = (nombre: number, mot: string) => `${nombre} ${mot}${nombre > 1 ? 's' : ''}`;

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

const champsEnDoublon = (error: Prisma.PrismaClientKnownRequestError) => {
  const cible = error.meta?.target;
  return Array.isArray(cible) ? cible.map(String) : typeof cible === 'string' ? [cible] : [];
};

export function endpoint<T extends unknown[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) {
      if (error instanceof ApiError) {
        const { champ, suggestion } = error.options;
        return json({ error: error.message, ...(champ ? { details: [{ champ, message: error.message }] } : {}), ...(suggestion ? { suggestion } : {}) }, error.status);
      }
      if (error instanceof ZodError) return json({ error: 'Vérifiez les champs signalés.', details: error.issues.map(i => ({ champ: i.path.join('.'), message: messageValidation(i) })) }, 400);
      if (error instanceof SyntaxError) return json({ error: 'JSON invalide' }, 400);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return json({ error: 'Élément introuvable : il a peut-être déjà été supprimé.' }, 404);
        if (error.code === 'P2002') return json({ error: 'Cette valeur est déjà utilisée par un autre élément.', details: champsEnDoublon(error).map(champ => ({ champ, message: 'Déjà utilisé par un autre élément : choisissez une autre valeur.' })) }, 409);
        if (error.code === 'P2003') return json({ error: 'Cet élément est encore utilisé ailleurs sur le site : il ne peut pas être supprimé.' }, 409);
        if (['P2034', 'P2028'].includes(error.code)) return json({ error: 'Quelqu’un a modifié la même chose au même moment. Réessayez.' }, 409);
      }
      console.error('Erreur API', error instanceof Error ? error.name : 'Erreur inconnue');
      return json({ error: 'Erreur interne du serveur' }, 500);
    }
  };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function positiveId(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new ApiError(400, 'Identifiant invalide');
  return Number(value);
}

export type RouteContext = { params: Promise<{ id: string }> };
