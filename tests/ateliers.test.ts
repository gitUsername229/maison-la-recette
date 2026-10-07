import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
// Coordonnées saisies par une visiteuse (pas de compte), case de consentement cochée.
const client = { nom: 'Camille', email: 'camille@example.com', consentement: new Date() };
let bookings: typeof import('../src/backend/ateliers/bookings');
let handlers: typeof import('../src/backend/ateliers/payment-handlers');
let catalogue: typeof import('../src/backend/ateliers/catalogue');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  bookings = await import('../src/backend/ateliers/bookings');
  handlers = await import('../src/backend/ateliers/payment-handlers');
  catalogue = await import('../src/backend/ateliers/catalogue');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

async function workshop(placesTotal = 2) {
  const experience = await prisma.experience.create({ data: { slug: randomUUID(), type: 'atelier', titre: 'Atelier test', accroche: 'Test', description: 'Test', dureeMin: 60, prixCents: 4500, capaciteMax: placesTotal, image: '', imageAlt: '' } });
  const session = await prisma.session.create({ data: { experienceId: experience.id, dateDebut: new Date(Date.now() + 86400_000), dateFin: new Date(Date.now() + 90000_000), lieu: 'Test', placesTotal } });
  return { sessionId: session.id, nbPersonnes: 1 };
}

/** Réservation de Camille sur cette session (sessionId et nbPersonnes). */
const reserver = (input: { sessionId: number; nbPersonnes: number }, key: string, stripe: Stripe) => bookings.createCheckout({ ...input, ...client }, key, stripe);

function gateway(timeoutOnce = false) {
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const keys = new Map<string, string>();
  const client = { checkout: { sessions: {
    async create(payload: Stripe.Checkout.SessionCreateParams, options: Stripe.RequestOptions) {
      const key = options.idempotencyKey!;
      if (keys.has(key)) return sessions.get(keys.get(key)!)!;
      const id = `cs_test_${randomUUID().replaceAll('-', '')}`;
      const item = payload.line_items![0];
      const session = { id, mode: 'payment', status: 'open', payment_status: 'unpaid', currency: 'eur', amount_total: item.price_data!.unit_amount! * item.quantity!, url: `https://checkout.stripe.com/${id}`, metadata: payload.metadata, client_reference_id: payload.client_reference_id, livemode: false } as Stripe.Checkout.Session;
      sessions.set(id, session); keys.set(key, id);
      if (timeoutOnce) { timeoutOnce = false; throw new Error('Network timeout after creation'); }
      return session;
    },
    async retrieve(id: string) { return sessions.get(id)!; },
    async expire(id: string) { const session = sessions.get(id)!; session.status = 'expired'; return session; },
  } } } as unknown as Stripe;
  return { client, sessions };
}

test('le montant vient de la base et une même clé ne crée pas deux réservations', async () => {
  const input = await workshop(); const fake = gateway(); const key = randomUUID();
  const first = await reserver(input, key, fake.client);
  const second = await reserver(input, key, fake.client);
  assert.deepEqual(first, second);
  assert.equal(first.montantCents, 4500);
  assert.equal(fake.sessions.size, 1);
  await assert.rejects(reserver({ ...input, nbPersonnes: 2 }, key, fake.client));
  // La même clé avec une autre adresse e-mail n'ouvre pas le paiement de Camille.
  await assert.rejects(bookings.createCheckout({ ...input, ...client, email: 'autre@example.com' }, key, fake.client), { status: 409 });
});

test('deux demandes concurrentes ne peuvent pas prendre la dernière place', async () => {
  const input = await workshop(1); const fake = gateway();
  const results = await Promise.allSettled([reserver(input, randomUUID(), fake.client), reserver(input, randomUUID(), fake.client)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(await prisma.reservation.count({ where: { sessionId: input.sessionId, statut: 'en_attente' } }), 1);
});

test('un webhook payé répété incrémente les places une seule fois', async () => {
  const input = await workshop(1); const fake = gateway();
  await reserver(input, randomUUID(), fake.client);
  const paid = { ...[...fake.sessions.values()][0], status: 'complete', payment_status: 'paid' } as Stripe.Checkout.Session;
  await bookings.applyStripeSession(paid, 'checkout.session.completed');
  await bookings.applyStripeSession(paid, 'checkout.session.completed');
  await bookings.applyStripeSession({ ...paid, status: 'expired' }, 'checkout.session.expired');
  const session = await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId } });
  assert.equal(session.placesPrises, 1); assert.equal(session.statut, 'complete');
});

test('un montant Stripe incorrect ne confirme pas le paiement', async () => {
  const input = await workshop(); const fake = gateway();
  await reserver(input, randomUUID(), fake.client);
  const paid = { ...[...fake.sessions.values()][0], status: 'complete', payment_status: 'paid', amount_total: 1 } as Stripe.Checkout.Session;
  await assert.rejects(bookings.applyStripeSession(paid, 'checkout.session.completed'));
  assert.equal((await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId } })).placesPrises, 0);
});

test('une expiration libère les places et une réservation payée ne peut pas être annulée silencieusement', async () => {
  const input = await workshop(1); const fake = gateway();
  await reserver(input, randomUUID(), fake.client);
  await bookings.applyStripeSession({ ...[...fake.sessions.values()][0], status: 'expired' }, 'checkout.session.expired');
  const next = await reserver(input, randomUUID(), fake.client);
  const paid = { ...[...fake.sessions.values()][1], status: 'complete', payment_status: 'paid' } as Stripe.Checkout.Session;
  await bookings.applyStripeSession(paid, 'checkout.session.completed');
  await assert.rejects(bookings.cancelReservation(next.reservationId, fake.client));
});

test('un timeout réseau conserve les places et la reprise retrouve le même paiement', async () => {
  const input = await workshop(1); const fake = gateway(true); const key = randomUUID();
  await assert.rejects(reserver(input, key, fake.client));
  await assert.rejects(reserver(input, randomUUID(), fake.client));
  const result = await reserver(input, key, fake.client);
  assert.equal(fake.sessions.size, 1); assert.ok(result.checkoutUrl);
});

test('une annulation expire le paiement avant de libérer la place', async () => {
  const input = await workshop(1); const fake = gateway();
  const first = await reserver(input, randomUUID(), fake.client);
  await bookings.cancelReservation(first.reservationId, fake.client);
  assert.equal([...fake.sessions.values()][0].status, 'expired');
  await reserver(input, randomUUID(), fake.client);
});

test('la signature du webhook est vérifiée sur le corps brut', async () => {
  const input = await workshop(); const fake = gateway();
  await reserver(input, randomUUID(), fake.client);
  const paid = { ...[...fake.sessions.values()][0], status: 'complete', payment_status: 'paid' };
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed', livemode: false, data: { object: paid } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const response = await handlers.webhook(new Request('http://localhost/api/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } }));
  assert.equal(response.status, 200);
  const invalid = await handlers.webhook(new Request('http://localhost/api/webhook', { method: 'POST', body: payload + ' ', headers: { 'stripe-signature': header } }));
  assert.equal(invalid.status, 400);
});

test('les mutations admin et la capacité sont protégées', async () => {
  const denied = await catalogue.createExperience(new Request('http://localhost/api/experiences', { method: 'POST', body: '{}' }));
  assert.equal(denied.status, 401);
  const input = await workshop(2); const fake = gateway();
  await reserver({ ...input, nbPersonnes: 2 }, randomUUID(), fake.client);
  const response = await catalogue.updateSession(new Request('http://localhost/api/sessions/1', { method: 'PUT', headers: { 'x-admin-key': process.env.ADMIN_KEY! }, body: JSON.stringify({ placesTotal: 1 }) }), { params: Promise.resolve({ id: String(input.sessionId) }) });
  assert.equal(response.status, 409);
});

test('le remboursement intégral permet une seule libération des places', async () => {
  const input = await workshop(1); const fake = gateway();
  const result = await reserver(input, randomUUID(), fake.client);
  const session = [...fake.sessions.values()][0];
  session.status = 'complete'; session.payment_status = 'paid';
  await bookings.applyStripeSession(session, 'checkout.session.completed');
  session.payment_intent = { latest_charge: { refunded: true, amount_refunded: 4500, currency: 'eur' } } as Stripe.PaymentIntent;
  await bookings.cancelReservation(result.reservationId, fake.client);
  await bookings.cancelReservation(result.reservationId, fake.client);
  const stored = await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId } });
  assert.equal(stored.placesPrises, 0); assert.equal(stored.statut, 'ouverte');
});

test('une mise à jour partielle ne réactive pas une expérience ou une session fermée', async () => {
  const input = await workshop();
  const session = await prisma.session.update({ where: { id: input.sessionId }, data: { statut: 'complete' } });
  await prisma.experience.update({ where: { id: session.experienceId }, data: { actif: false } });
  const request = (body: unknown) => new Request('http://localhost/api', { method: 'PUT', headers: { 'x-admin-key': process.env.ADMIN_KEY! }, body: JSON.stringify(body) });
  assert.equal((await catalogue.updateSession(request({ prixCents: 5000 }), { params: Promise.resolve({ id: String(session.id) }) })).status, 200);
  assert.equal((await catalogue.updateExperience(request({ titre: 'Nouveau titre' }), { params: Promise.resolve({ id: String(session.experienceId) }) })).status, 200);
  assert.equal((await prisma.session.findUniqueOrThrow({ where: { id: session.id } })).statut, 'complete');
  assert.equal((await prisma.experience.findUniqueOrThrow({ where: { id: session.experienceId } })).actif, false);
});

test('une expérience sur devis ne peut pas ouvrir de paiement Stripe', async () => {
  const input = await workshop(); const fake = gateway();
  const session = await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId } });
  await prisma.experience.update({ where: { id: session.experienceId }, data: { reservableEnLigne: false } });
  await assert.rejects(reserver(input, randomUUID(), fake.client), { status: 400 });
  assert.equal(fake.sessions.size, 0);
});

test('les paiements créés avant la fusion restent confirmables', async () => {
  const input = await workshop();
  const reservation = await prisma.reservation.create({ data: { ...input, nom: client.nom, email: client.email, montantCents: 4500, stripeSessionId: 'cs_test_legacy' } });
  const paid = { id: 'cs_test_legacy', mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 4500, currency: 'eur', livemode: false, client_reference_id: null, metadata: { reservationId: String(reservation.id) } } as unknown as Stripe.Checkout.Session;
  await bookings.applyStripeSession(paid, 'checkout.session.completed');
  await bookings.applyStripeSession(paid, 'checkout.session.completed');
  assert.equal((await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId } })).placesPrises, 1);
});

test('un ancien paiement différé échoué libère ses places', async () => {
  const input = await workshop();
  const reservation = await prisma.reservation.create({ data: { ...input, nom: client.nom, email: client.email, montantCents: 4500, stripeSessionId: 'cs_test_failed' } });
  const failed = { id: 'cs_test_failed', mode: 'payment', status: 'complete', payment_status: 'unpaid', livemode: false, client_reference_id: null, metadata: { reservationId: String(reservation.id) } } as unknown as Stripe.Checkout.Session;
  await bookings.applyStripeSession(failed, 'checkout.session.async_payment_failed');
  assert.equal((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).statut, 'annulee');
});

test('un paiement Stripe expiré ne bloque plus de place, même si le webhook « expired » n’est jamais arrivé', async () => {
  const places = await import('../src/backend/places');
  const input = await workshop(1); const fake = gateway();
  const ilYa = (minutes: number) => new Date(Date.now() - minutes * 60_000);
  const enAttente = await prisma.reservation.create({ data: { ...input, nom: client.nom, email: client.email, montantCents: 4500, createdAt: ilYa(20) } });

  // Paiement ouvert il y a 20 min : Stripe peut encore l'accepter, la dernière place reste bloquée.
  assert.equal(await places.placesDisponibles(prisma, input.sessionId), 0);
  await assert.rejects(reserver(input, randomUUID(), fake.client), { status: 409 });

  // Ouvert il y a 40 min : expiré chez Stripe (35 min), aucun événement reçu. La place est libérée partout.
  await prisma.reservation.update({ where: { id: enAttente.id }, data: { createdAt: ilYa(40) } });
  assert.equal(await places.placesDisponibles(prisma, input.sessionId), 1);
  const { experience } = await prisma.session.findUniqueOrThrow({ where: { id: input.sessionId }, include: { experience: true } });
  assert.equal((await catalogue.experiencePublique(experience.slug))?.sessions[0].placesRestantes, 1);
  assert.equal((await reserver(input, randomUUID(), fake.client)).montantCents, 4500);
});
