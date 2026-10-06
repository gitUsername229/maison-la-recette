import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest } from './outils';

const BASE = 'http://localhost:3000';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let auth: typeof import('../src/backend/auth/auth').auth;
let handlers: typeof import('../src/backend/ateliers/payment-handlers');
let devis: typeof import('../src/backend/ateliers/devis');
let catalogue: typeof import('../src/backend/ateliers/catalogue');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  ({ auth } = await import('../src/backend/auth/auth'));
  handlers = await import('../src/backend/ateliers/payment-handlers');
  devis = await import('../src/backend/ateliers/devis');
  catalogue = await import('../src/backend/ateliers/catalogue');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

/** Inscription par la vraie route Better Auth ; renvoie le cookie de session. */
async function inscrire(email: string, telephone?: string) {
  const corps = { name: `Client ${email}`, email, password: 'motdepasse-de-test', ...(telephone ? { telephone } : {}) };
  const reponse = await auth.handler(new Request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify(corps),
  }));
  assert.equal(reponse.status, 200);
  const cookie = reponse.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const utilisateur = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { cookie, id: utilisateur.id };
}

function requete(chemin: string, { cookie, methode = 'GET', corps, entetes = {} }: { cookie?: string; methode?: string; corps?: unknown; entetes?: Record<string, string> } = {}) {
  return new Request(`${BASE}${chemin}`, {
    method: methode,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...entetes },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
}

const DEVIS = { entreprise: 'Acme', typeDemande: 'studio', message: 'Un podcast pour notre marque' };

test('réserver et demander un devis exigent un compte connecté (401)', async () => {
  const checkout = await handlers.checkout(requete('/api/checkout', { methode: 'POST', corps: { sessionId: 1, nbPersonnes: 1 } }));
  assert.equal(checkout.status, 401);
  const demande = await devis.createDevis(requete('/api/devis', { methode: 'POST', corps: DEVIS }));
  assert.equal(demande.status, 401);
});

test('le devis reprend le nom, l’e-mail et le téléphone du compte, jamais ceux du front', async () => {
  const camille = await inscrire('devis@example.com', '0600000001');
  const usurpation = await devis.createDevis(requete('/api/devis', { cookie: camille.cookie, methode: 'POST', corps: { ...DEVIS, userId: 'autre', email: 'pirate@example.com' } }));
  assert.equal(usurpation.status, 400);

  const reponse = await devis.createDevis(requete('/api/devis', { cookie: camille.cookie, methode: 'POST', corps: DEVIS }));
  assert.equal(reponse.status, 201);
  const { id } = await reponse.json() as { id: number };
  const enregistre = await prisma.demandeDevis.findUniqueOrThrow({ where: { id } });
  assert.deepEqual(
    { userId: enregistre.userId, email: enregistre.email, telephone: enregistre.telephone },
    { userId: camille.id, email: 'devis@example.com', telephone: '0600000001' },
  );
});

test('un client ne peut pas lire la réservation d’un autre client', async () => {
  const alice = await inscrire('alice@example.com');
  const bruno = await inscrire('bruno@example.com');
  const experience = await prisma.experience.create({ data: { slug: 'acces-test', type: 'atelier', titre: 'Atelier', accroche: 'A', description: 'D', dureeMin: 60, prixCents: 4500, capaciteMax: 5, image: '', imageAlt: '' } });
  const session = await prisma.session.create({ data: { experienceId: experience.id, dateDebut: new Date(Date.now() + 86400_000), dateFin: new Date(Date.now() + 90000_000), lieu: 'Test', placesTotal: 5 } });
  await prisma.reservation.create({ data: { sessionId: session.id, userId: alice.id, nom: 'Alice', email: 'alice@example.com', nbPersonnes: 1, montantCents: 4500, stripeSessionId: 'cs_test_alice' } });

  const chemin = '/api/reservations?session_id=cs_test_alice';
  assert.equal((await handlers.listReservations(requete(chemin))).status, 401);
  assert.equal((await handlers.listReservations(requete(chemin, { cookie: bruno.cookie }))).status, 404);
  assert.equal((await handlers.listReservations(requete(chemin, { cookie: alice.cookie }))).status, 200);
});

test('les routes admin refusent un visiteur (401) et un client (403)', async () => {
  const client = await inscrire('client-admin@example.com');
  const creer = (cookie?: string) => catalogue.createExperience(requete('/api/experiences', { cookie, methode: 'POST', corps: {} }));
  assert.equal((await creer()).status, 401);
  assert.equal((await creer(client.cookie)).status, 403);
});

test('x-admin-key est accepté en développement et refusé en production', async () => {
  const liste = () => handlers.listReservations(requete('/api/reservations', { entetes: { 'x-admin-key': process.env.ADMIN_KEY! } }));
  assert.equal((await liste()).status, 200);
  const environnement = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: 'production' });
  try {
    assert.equal((await liste()).status, 401);
  } finally {
    if (environnement === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Object.assign(process.env, { NODE_ENV: environnement });
  }
});
