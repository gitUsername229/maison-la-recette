import assert from 'node:assert/strict';
import { rm, stat } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { BASE, inscrire, preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let handlers: typeof import('../src/backend/ateliers/payment-handlers');
let devis: typeof import('../src/backend/ateliers/devis');
let catalogue: typeof import('../src/backend/ateliers/catalogue');
let utilisateurs: typeof import('../src/backend/comptes/utilisateurs');
let contenus: typeof import('../src/backend/contenus/contenus');
let images: typeof import('../src/backend/contenus/images');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  handlers = await import('../src/backend/ateliers/payment-handlers');
  devis = await import('../src/backend/ateliers/devis');
  catalogue = await import('../src/backend/ateliers/catalogue');
  utilisateurs = await import('../src/backend/comptes/utilisateurs');
  contenus = await import('../src/backend/contenus/contenus');
  images = await import('../src/backend/contenus/images');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const avecId = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });
const CLE_ADMIN = () => ({ 'x-admin-key': process.env.ADMIN_KEY! });

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

test('le dernier compte admin ne peut être ni rétrogradé ni supprimé, même par lui-même', async () => {
  const julie = await inscrire('julie@example.com');
  await prisma.user.update({ where: { id: julie.id }, data: { role: 'admin' } });
  const modifier = (cookie: string, id: string, corps: unknown) =>
    utilisateurs.updateUtilisateur(requete(`/api/utilisateurs/${id}`, { cookie, methode: 'PATCH', corps }), avecId(id));
  const supprimer = (cookie: string, id: string) =>
    utilisateurs.deleteUtilisateur(requete(`/api/utilisateurs/${id}`, { cookie, methode: 'DELETE' }), avecId(id));

  assert.equal((await modifier(julie.cookie, julie.id, { role: 'client' })).status, 409);
  assert.equal((await supprimer(julie.cookie, julie.id)).status, 409);

  // Avec un second admin, Julie peut se rétrograder ; Marc devient alors le dernier.
  const marc = await inscrire('marc@example.com');
  assert.equal((await modifier(julie.cookie, marc.id, { role: 'admin' })).status, 200);
  assert.equal((await modifier(julie.cookie, julie.id, { role: 'client' })).status, 200);
  assert.equal((await modifier(julie.cookie, marc.id, { role: 'client' })).status, 403);
  assert.equal((await supprimer(marc.cookie, marc.id)).status, 409);
  assert.equal(await prisma.user.count({ where: { role: 'admin' } }), 1);
});

test('un contenu masqué n’est visible que par l’admin, et une modification partielle ne le rend pas visible', async () => {
  const { id } = await prisma.avis.create({ data: { nom: 'Claire D.', citation: 'Super atelier', contexte: 'Team building', visible: false } });
  const lister = async (entetes: Record<string, string> = {}) => (await (await contenus.avis.lister(requete('/api/avis', { entetes }))).json()) as unknown[];
  assert.equal((await lister()).length, 0);
  assert.equal((await lister(CLE_ADMIN())).length, 1);

  const reponse = await contenus.avis.modifier(requete(`/api/avis/${id}`, { methode: 'PUT', corps: { citation: 'Très bel atelier' }, entetes: CLE_ADMIN() }), avecId(id));
  assert.equal(reponse.status, 200);
  assert.equal((await prisma.avis.findUniqueOrThrow({ where: { id } })).visible, false);
});

test('l’envoi d’image vérifie le contenu du fichier et la suppression efface la photo', async () => {
  const envoyer = (contenu: Uint8Array<ArrayBuffer>, nom: string) => {
    const formulaire = new FormData();
    formulaire.append('fichier', new File([contenu], nom));
    return images.envoyerFichier(new Request(`${BASE}/api/images/fichier`, { method: 'POST', headers: CLE_ADMIN(), body: formulaire }));
  };
  assert.equal((await envoyer(new TextEncoder().encode('<script>alert(1)</script>'), 'faux.jpg')).status, 400);

  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const reponse = await envoyer(png, 'photo.png');
  assert.equal(reponse.status, 201);
  const { url } = await reponse.json() as { url: string };
  const fichier = `${process.cwd()}/public${url}`;
  try {
    assert.match(url, /^\/images\/uploads\/[\w-]+\.png$/);
    const image = await prisma.image.create({ data: { url, alt: 'Atelier', page: '/a-propos' } });
    assert.equal((await images.images.supprimer(requete(`/api/images/${image.id}`, { methode: 'DELETE', entetes: CLE_ADMIN() }), avecId(image.id))).status, 200);
    await assert.rejects(stat(fichier));
  } finally {
    await rm(fichier, { force: true });
  }
});
