import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { BASE, creerCompte, preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let handlers: typeof import('../src/backend/ateliers/payment-handlers');
let bookings: typeof import('../src/backend/ateliers/bookings');
let devis: typeof import('../src/backend/ateliers/devis');
let catalogue: typeof import('../src/backend/ateliers/catalogue');
let utilisateurs: typeof import('../src/backend/comptes/utilisateurs');
let contenus: typeof import('../src/backend/contenus/contenus');
let images: typeof import('../src/backend/contenus/images');
let newsletter: typeof import('../src/backend/contenus/newsletter');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  handlers = await import('../src/backend/ateliers/payment-handlers');
  bookings = await import('../src/backend/ateliers/bookings');
  devis = await import('../src/backend/ateliers/devis');
  catalogue = await import('../src/backend/ateliers/catalogue');
  utilisateurs = await import('../src/backend/comptes/utilisateurs');
  contenus = await import('../src/backend/contenus/contenus');
  images = await import('../src/backend/contenus/images');
  newsletter = await import('../src/backend/contenus/newsletter');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const avecId = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });
const CLE_ADMIN = () => ({ 'x-admin-key': process.env.ADMIN_KEY! });

const DEVIS = { nom: 'Sophie Martin', entreprise: 'Acme', email: 'sophie@example.com', telephone: '0600000001', typeDemande: 'studio', message: 'Un podcast pour notre marque' };

/** Champs signalés par une réponse 400 de validation. */
const champsRefuses = async (reponse: Response) => ((await reponse.json()) as { details?: { champ: string }[] }).details?.map(d => d.champ).sort();

async function sessionOuverte(slug: string) {
  const experience = await prisma.experience.create({ data: { slug, type: 'atelier', titre: 'Atelier', accroche: 'A', description: 'D', dureeMin: 60, prixCents: 4500, capaciteMax: 5, image: '', imageAlt: '' } });
  return prisma.session.create({ data: { experienceId: experience.id, dateDebut: new Date(Date.now() + 86400_000), dateFin: new Date(Date.now() + 90000_000), lieu: 'Test', placesTotal: 5 } });
}

test('demander un devis se fait sans compte : les coordonnées saisies sont enregistrées', async () => {
  const reponse = await devis.createDevis(requete('/api/devis', { methode: 'POST', corps: DEVIS }));
  assert.equal(reponse.status, 201);
  assert.deepEqual(Object.keys(await reponse.json()), ['message']); // aucun identifiant interne communiqué au visiteur
  const enregistre = await prisma.demandeDevis.findFirstOrThrow({ where: { email: 'sophie@example.com' } });
  assert.deepEqual(
    { contactNom: enregistre.contactNom, entreprise: enregistre.entreprise, telephone: enregistre.telephone },
    { contactNom: 'Sophie Martin', entreprise: 'Acme', telephone: '0600000001' },
  );

  // Champ inconnu refusé (l'ancien userId notamment) ; nom, e-mail et téléphone obligatoires.
  assert.equal((await devis.createDevis(requete('/api/devis', { methode: 'POST', corps: { ...DEVIS, userId: 'autre' } }))).status, 400);
  const incomplet = await devis.createDevis(requete('/api/devis', { methode: 'POST', corps: { ...DEVIS, nom: undefined, email: 'pas-une-adresse', telephone: undefined } }));
  assert.equal(incomplet.status, 400);
  assert.deepEqual(await champsRefuses(incomplet), ['email', 'nom', 'telephone']);
});

test('réserver se fait sans compte : nom et e-mail demandés, téléphone facultatif', async () => {
  // Sans coordonnées : refus de validation (et non 401 « connectez-vous »), avant tout appel à Stripe.
  const reponse = await handlers.checkout(requete('/api/checkout', { methode: 'POST', corps: { sessionId: 1, nbPersonnes: 1 } }));
  assert.equal(reponse.status, 400);
  assert.deepEqual(await champsRefuses(reponse), ['email', 'nom']);
  const telephoneInvalide = await handlers.checkout(requete('/api/checkout', { methode: 'POST', corps: { sessionId: 1, nbPersonnes: 1, nom: 'Camille', email: 'camille@example.com', telephone: '12' } }));
  assert.deepEqual(await champsRefuses(telephoneInvalide), ['telephone']);
});

test('après paiement, la réservation n’est montrée que si la session Stripe existe et la désigne', async () => {
  const session = await sessionOuverte('apres-paiement');
  const reservation = await prisma.reservation.create({ data: { sessionId: session.id, nom: 'Camille', email: 'camille@example.com', telephone: '0600000004', nbPersonnes: 1, montantCents: 4500, stripeSessionId: 'cs_test_camille' } });
  const enCours = { id: 'cs_test_camille', livemode: false, mode: 'payment', status: 'open', payment_status: 'unpaid', metadata: { reservationId: String(reservation.id) } };
  const stripe = (reponse: object | Error) => ({ checkout: { sessions: { retrieve: async () => { if (reponse instanceof Error) throw reponse; return reponse; } } } }) as unknown as Stripe;
  const apresPaiement = (id: string, reponse: object | Error) => bookings.reservationApresPaiement(id, stripe(reponse));

  // Identifiant mal formé (400) ou absent de la base (404), sans même interroger Stripe.
  assert.equal((await handlers.listReservations(requete('/api/reservations?session_id=abc'))).status, 400);
  assert.equal((await handlers.listReservations(requete('/api/reservations?session_id=cs_test_inconnu'))).status, 404);
  // Session Stripe qui désigne une autre réservation, ou inconnue de Stripe : rien n'est montré.
  assert.deepEqual(await apresPaiement('cs_test_camille', { ...enCours, metadata: { reservationId: String(reservation.id + 1) } }), { refus: 'introuvable' });
  assert.deepEqual(await apresPaiement('cs_test_camille', { ...enCours, livemode: true }), { refus: 'introuvable' });
  assert.deepEqual(await apresPaiement('cs_test_camille', Object.assign(new Error('No such checkout.session'), { name: 'StripeInvalidRequestError' })), { refus: 'introuvable' });
  // Stripe injoignable : rien n'est montré non plus, la page invite à réessayer.
  assert.deepEqual(await apresPaiement('cs_test_camille', new Error('Timeout')), { refus: 'indisponible' });

  // Session valide qui correspond : la réservation est montrée, sans nom, e-mail ni téléphone.
  const resultat = await apresPaiement('cs_test_camille', enCours);
  assert.ok('reservation' in resultat);
  assert.equal(resultat.reservation.statut, 'en_attente');
  assert.deepEqual(Object.keys(resultat.reservation).sort(), ['id', 'montantCents', 'nbPersonnes', 'session', 'statut']);
});

test('un compte sans le rôle admin n’a aucun droit ; sans session, 401', async () => {
  const sansRole = await creerCompte('sans-role@example.com', 'client');
  const routes = (cookie?: string) => Promise.all([
    catalogue.createExperience(requete('/api/experiences', { cookie, methode: 'POST', corps: {} })),
    handlers.listReservations(requete('/api/reservations', { cookie })),
    devis.listDevis(requete('/api/devis', { cookie })),
    newsletter.lister(requete('/api/newsletter', { cookie })),
    utilisateurs.listUtilisateurs(requete('/api/utilisateurs', { cookie })),
  ]);
  assert.deepEqual((await routes()).map(r => r.status), [401, 401, 401, 401, 401]);
  assert.deepEqual((await routes(sansRole.cookie)).map(r => r.status), [403, 403, 403, 403, 403]);
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

test('gestion des admins : ajout sans mot de passe, suppression, jamais le dernier admin', async () => {
  const julie = await creerCompte('julie@example.com');
  const ajouter = (corps: unknown) => utilisateurs.ajouterAdmin(requete('/api/utilisateurs', { cookie: julie.cookie, methode: 'POST', corps }));
  const supprimer = (id: string, options: { cookie?: string; entetes?: Record<string, string> }) =>
    utilisateurs.deleteUtilisateur(requete(`/api/utilisateurs/${id}`, { ...options, methode: 'DELETE' }), avecId(id));

  // Julie est la seule admin : elle ne peut pas supprimer son propre accès.
  assert.equal((await supprimer(julie.id, { cookie: julie.cookie })).status, 409);

  // Ajout de Marc : admin d'office, sans mot de passe tant qu'il n'a pas utilisé le lien reçu par e-mail.
  const ajout = await ajouter({ nom: 'Marc', email: ' Marc@Example.com ' });
  assert.equal(ajout.status, 201);
  const marc = await ajout.json() as { id: string; email: string };
  assert.equal(marc.email, 'marc@example.com');
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: marc.id } })).role, 'admin');
  assert.equal(await prisma.authAccount.count({ where: { userId: marc.id } }), 0);
  const liste = await (await utilisateurs.listUtilisateurs(requete('/api/utilisateurs', { cookie: julie.cookie }))).json() as { email: string; motDePasseChoisi: boolean }[];
  assert.deepEqual(liste.map(a => [a.email, a.motDePasseChoisi]), [['julie@example.com', true], ['marc@example.com', false]]);

  // Adresse déjà utilisée, ou rôle envoyé par le formulaire : refusés.
  assert.equal((await ajouter({ nom: 'Marc bis', email: 'marc@example.com' })).status, 409);
  assert.equal((await ajouter({ nom: 'Léa', email: 'lea@example.com', role: 'client' })).status, 400);

  // Avec Marc, Julie peut retirer son propre accès : sa connexion est fermée et Marc devient le dernier admin.
  assert.equal((await supprimer(julie.id, { cookie: julie.cookie })).status, 200);
  assert.equal((await utilisateurs.listUtilisateurs(requete('/api/utilisateurs', { cookie: julie.cookie }))).status, 401);
  assert.equal((await supprimer(marc.id, { entetes: CLE_ADMIN() })).status, 409);
  assert.equal(await prisma.user.count({ where: { role: 'admin' } }), 1);
});

test('connexion admin : session de 30 jours, prolongée à chaque visite', async () => {
  const { auth } = await import('../src/backend/auth/auth');
  const { id, cookie } = await creerCompte('session@example.com');
  const joursRestants = async () => {
    const { expiresAt } = await prisma.authSession.findFirstOrThrow({ where: { userId: id } });
    return Math.round((expiresAt.getTime() - Date.now()) / 86400_000);
  };
  assert.equal(await joursRestants(), 30);

  // Dernière visite il y a 5 jours : il en reste 25 ; la visite suivante les ramène à 30 (cookie compris).
  await prisma.authSession.updateMany({ where: { userId: id }, data: { expiresAt: new Date(Date.now() + 25 * 86400_000) } });
  const visite = await auth.handler(new Request(`${BASE}/api/auth/get-session`, { headers: { cookie, origin: BASE } }));
  assert.equal(visite.status, 200);
  assert.equal(await joursRestants(), 30);
  assert.ok(visite.headers.getSetCookie().some(c => c.includes('Max-Age=2592000')));
});

test('/admin : sans connexion, redirection vers /admin/connexion ; sans le rôle admin, « Accès refusé »', async () => {
  const { redirectionRefus } = await import('../src/backend/auth/acces');
  assert.equal(redirectionRefus(401, '/admin/devis'), '/admin/connexion?retour=%2Fadmin%2Fdevis');
  assert.equal(redirectionRefus(403, '/admin/devis'), '/acces-refuse');

  // Chaque page de l'espace admin vérifie elle-même la connexion et le rôle côté serveur.
  const pages = (await readdir('src/app/admin/(espace)', { recursive: true })).filter(f => f.endsWith('page.tsx'));
  assert.ok(pages.length >= 2);
  for (const page of pages) assert.match(await readFile(join('src/app/admin/(espace)', page), 'utf8'), /await exigerAdminPage\(/, page);
});

test('plus aucune page de compte : /inscription, /compte et l’ancienne /connexion n’existent plus (404)', () => {
  for (const chemin of ['inscription', 'compte', 'connexion', 'mot-de-passe-oublie', 'reinitialiser-mot-de-passe', 'api/compte']) {
    assert.equal(existsSync(join('src/app', chemin)), false, chemin);
  }
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
