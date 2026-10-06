import 'server-only';
import type { z } from 'zod';
import { estAdmin, exigerAdmin } from '@/backend/auth/acces';
import { endpoint, json, positiveId, type RouteContext } from '@/backend/http';

type Ressource<Creation, Modification> = {
  schemas: { creation: z.ZodType<Creation>; modification: z.ZodType<Modification> };
  /** `admin` : inclure les contenus masqués (brouillons, avis cachés…). */
  lister: (admin: boolean, params: URLSearchParams) => Promise<unknown>;
  creer: (donnees: Creation) => Promise<unknown>;
  modifier: (id: number, donnees: Modification) => Promise<unknown>;
  supprimer: (id: number) => Promise<unknown>;
};

/**
 * Les quatre routes d'une ressource de contenu : GET public (tout le contenu pour un admin),
 * puis POST, PUT et DELETE réservés à l'admin, avec validation zod des entrées.
 */
export function routesRessource<Creation, Modification>(ressource: Ressource<Creation, Modification>) {
  return {
    lister: endpoint(async (request: Request) =>
      json(await ressource.lister(await estAdmin(request), new URL(request.url).searchParams))),

    creer: endpoint(async (request: Request) => {
      await exigerAdmin(request);
      return json(await ressource.creer(ressource.schemas.creation.parse(await request.json())), 201);
    }),

    modifier: endpoint(async (request: Request, context: RouteContext) => {
      await exigerAdmin(request);
      const id = positiveId((await context.params).id);
      return json(await ressource.modifier(id, ressource.schemas.modification.parse(await request.json())));
    }),

    supprimer: endpoint(async (request: Request, context: RouteContext) => {
      await exigerAdmin(request);
      await ressource.supprimer(positiveId((await context.params).id));
      return json({ ok: true });
    }),
  };
}

/** Entier positif lu dans l'URL (?limit=3), borné ; absent ou invalide → undefined. */
export function entierParametre(params: URLSearchParams, nom: string, max: number) {
  const valeur = Number(params.get(nom));
  return Number.isInteger(valeur) && valeur > 0 ? Math.min(valeur, max) : undefined;
}
