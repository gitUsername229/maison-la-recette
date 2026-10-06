import 'server-only';
import { z } from 'zod';
import { exigerAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { endpoint, json, positiveId, type RouteContext } from '@/backend/http';

// Adresse nettoyée (espaces, majuscules) avant d'être validée.
const abonnementSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email().max(254)) }).strict();

/**
 * POST /api/newsletter (public, et bouton « Ajouter » de l'admin). Même réponse que l'adresse soit
 * déjà inscrite ou non : on ne révèle pas qui est abonné.
 */
export const inscrire = endpoint(async (request: Request) => {
  const { email } = abonnementSchema.parse(await request.json());
  await prisma.newsletter.upsert({ where: { email }, update: {}, create: { email } });
  return json({ message: 'Merci ! Votre adresse est inscrite à la newsletter.' }, 201);
});

/** GET /api/newsletter (admin) : adresses inscrites, données personnelles réservées à l'admin. */
export const lister = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  return json(await prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } }));
});

/** PUT /api/newsletter/[id] (admin) : corriger une adresse. */
export const modifier = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  const data = abonnementSchema.parse(await request.json());
  return json(await prisma.newsletter.update({ where: { id: positiveId((await context.params).id) }, data }));
});

/** DELETE /api/newsletter/[id] (admin) : désinscrire une personne. */
export const supprimer = endpoint(async (request: Request, context: RouteContext) => {
  await exigerAdmin(request);
  await prisma.newsletter.delete({ where: { id: positiveId((await context.params).id) } });
  return json({ ok: true });
});
