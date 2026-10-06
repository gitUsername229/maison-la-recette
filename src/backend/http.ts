import 'server-only';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function endpoint<T extends unknown[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      if (error instanceof ZodError) return json({ error: 'Données invalides', details: error.issues.map(i => ({ champ: i.path.join('.'), message: i.message })) }, 400);
      if (error instanceof SyntaxError) return json({ error: 'JSON invalide' }, 400);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return json({ error: 'Ressource introuvable' }, 404);
        if (['P2002', 'P2003', 'P2034', 'P2028'].includes(error.code)) return json({ error: 'Conflit : ressource déjà utilisée ou modification concurrente. Réessayez.' }, 409);
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
