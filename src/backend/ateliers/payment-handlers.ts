import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/backend/db/prisma';
import { requireAdmin } from '@/backend/auth/admin';
import { ApiError, endpoint, json, positiveId, type RouteContext } from '@/backend/http';
import { getStripe } from '@/backend/payments/stripe';
import { checkoutSchema, cancellationSchema } from './validation';
import { applyStripeSession, cancelReservation, createCheckout } from './bookings';

export const checkout = endpoint(async (request: Request) => {
  // Compatibilité avec le formulaire existant du dépôt, qui n'envoie pas encore de clé.
  const key = z.uuid().parse(request.headers.get('Idempotency-Key') ?? randomUUID());
  const response = json(await createCheckout(checkoutSchema.parse(await request.json()), key));
  response.headers.set('Idempotency-Key', key);
  return response;
});

export const webhook = endpoint(async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) throw new ApiError(400, 'Signature Stripe absente');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret === 'whsec_xxx') throw new ApiError(503, 'Configurer STRIPE_WEBHOOK_SECRET');
  let stripe;
  try { stripe = getStripe(); } catch { throw new ApiError(503, 'Configurer STRIPE_SECRET_KEY'); }
  const body = await request.text();
  let event;
  try { event = stripe.webhooks.constructEvent(body, signature, secret); }
  catch { throw new ApiError(400, 'Signature Stripe invalide'); }
  if (event.livemode) throw new ApiError(400, 'Seuls les événements sandbox sont acceptés');
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_succeeded' || event.type === 'checkout.session.async_payment_failed') {
    await applyStripeSession(event.data.object, event.type);
  }
  return json({ received: true });
});

export const listReservations = endpoint(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const stripeId = params.get('session_id');
  if (stripeId !== null) {
    if (!/^cs_test_[A-Za-z0-9]+$/.test(stripeId)) throw new ApiError(400, 'Identifiant Stripe invalide');
    const reservation = await prisma.reservation.findUnique({ where: { stripeSessionId: stripeId }, select: { id: true, nom: true, nbPersonnes: true, montantCents: true, statut: true, session: { select: { dateDebut: true, lieu: true, experience: { select: { titre: true } } } } } });
    if (!reservation) throw new ApiError(404, 'Réservation introuvable');
    return json({ ...reservation, session: { ...reservation.session, experience: reservation.session.experience.titre } });
  }
  const denied = requireAdmin(request); if (denied) return denied;
  const statut = params.get('statut');
  if (statut && !['en_attente', 'payee', 'annulee'].includes(statut)) throw new ApiError(400, 'Statut invalide');
  return json(await prisma.reservation.findMany({ where: statut ? { statut } : {}, orderBy: { createdAt: 'desc' }, select: { id: true, sessionId: true, nom: true, email: true, telephone: true, nbPersonnes: true, montantCents: true, statut: true, stripeSessionId: true, createdAt: true } }));
});

export const cancel = endpoint(async (request: Request, context: RouteContext) => {
  const denied = requireAdmin(request); if (denied) return denied;
  cancellationSchema.parse(await request.json());
  return json(await cancelReservation(positiveId((await context.params).id)));
});
