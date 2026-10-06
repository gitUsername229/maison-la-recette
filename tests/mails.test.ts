import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { BASE, inscrire, preparerBaseDeTest, requete } from './outils';

type Envoye = { to: string; subject: string; html: string; text: string; replyTo?: string };

const envoyes: Envoye[] = [];
let nettoyer: () => Promise<void>;
let envoi: typeof import('../src/backend/mails/envoi');
let modeles: typeof import('../src/backend/mails/modeles');
let prisma: PrismaClient;
let handlers: typeof import('../src/backend/ateliers/payment-handlers');
let devis: typeof import('../src/backend/ateliers/devis');
let bookings: typeof import('../src/backend/ateliers/bookings');
let auth: typeof import('../src/backend/auth/auth').auth;

/** Transport Nodemailer en mémoire : les e-mails « envoyés » sont gardés dans `envoyes`. */
function transportMemoire() {
  return nodemailer.createTransport({
    name: 'memoire',
    version: '1',
    send(mail, fin) {
      envoyes.push(mail.data as unknown as Envoye);
      fin(null, { envelope: mail.message.getEnvelope(), messageId: 'test' });
    },
  });
}

before(async () => {
  nettoyer = await preparerBaseDeTest();
  envoi = await import('../src/backend/mails/envoi');
  modeles = await import('../src/backend/mails/modeles');
  ({ prisma } = await import('../src/backend/db/prisma'));
  handlers = await import('../src/backend/ateliers/payment-handlers');
  devis = await import('../src/backend/ateliers/devis');
  bookings = await import('../src/backend/ateliers/bookings');
  ({ auth } = await import('../src/backend/auth/auth'));
  envoi.utiliserTransport(transportMemoire());
});

beforeEach(() => { envoyes.length = 0; });

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

test('la mise en page neutralise le HTML saisi et fournit une version texte', async () => {
  await envoi.envoyerMail(modeles.composer('julie@exemple.fr', 'Essai', {
    titre: 'Bonjour <b>Julie</b>',
    paragraphes: ['<script>alert(1)</script>'],
    details: [['Entreprise', '"Acme" & fils']],
    lien: { texte: 'Voir', url: 'http://localhost:3000/compte?a=1&b=2' },
  }));
  assert.equal(envoyes.length, 1);
  const [mail] = envoyes;
  assert.ok(!mail.html.includes('<script>') && mail.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(mail.html.includes('&quot;Acme&quot; &amp; fils'));
  assert.ok(mail.html.includes('href="http://localhost:3000/compte?a=1&amp;b=2"'));
  assert.match(mail.text, /Entreprise : "Acme" & fils/);
});

test('un envoi en arrière-plan qui échoue est journalisé, sans erreur propagée', async t => {
  const journal = t.mock.method(console, 'error', () => undefined);
  envoi.enArrierePlan(Promise.reject(new Error('SMTP indisponible')));
  await envoi.attendreLesEnvois();
  assert.equal(journal.mock.callCount(), 1);
});

/** Réservation en attente + événement Stripe « paiement réussi » signé, comme l'enverrait Stripe. */
async function paiementReussi(stripeSessionId: string) {
  const experience = await prisma.experience.create({ data: { slug: stripeSessionId.replaceAll('_', '-').toLowerCase(), type: 'atelier', titre: 'Atelier pain perdu', accroche: 'A', description: 'D', dureeMin: 120, prixCents: 4500, capaciteMax: 10, image: '', imageAlt: '' } });
  const session = await prisma.session.create({ data: { experienceId: experience.id, dateDebut: new Date('2027-03-06T09:00:00Z'), dateFin: new Date('2027-03-06T11:00:00Z'), lieu: 'La Rochelle', placesTotal: 10 } });
  const reservation = await prisma.reservation.create({ data: { sessionId: session.id, nom: 'Camille', email: 'camille@example.com', nbPersonnes: 2, montantCents: 9000, stripeSessionId } });
  const paye = { id: stripeSessionId, mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 9000, currency: 'eur', livemode: false, client_reference_id: null, metadata: { reservationId: String(reservation.id) } };
  const corps = JSON.stringify({ id: `evt_${stripeSessionId}`, type: 'checkout.session.completed', livemode: false, data: { object: paye } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: corps, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const envoyer = () => handlers.webhook(new Request(`${BASE}/api/webhook`, { method: 'POST', body: corps, headers: { 'stripe-signature': signature } }));
  return { reservation, paye, envoyer };
}

test('un paiement confirmé envoie la confirmation au client et l’information à Julie, une seule fois', async () => {
  const { envoyer } = await paiementReussi('cs_test_mail_unique');
  assert.equal((await envoyer()).status, 200);
  assert.equal((await envoyer()).status, 200); // Stripe renvoie le même événement
  await envoi.attendreLesEnvois();

  assert.deepEqual(envoyes.map(m => m.to).sort(), ['camille@example.com', 'julie@exemple.fr']);
  const client = envoyes.find(m => m.to === 'camille@example.com')!;
  assert.match(client.subject, /Réservation confirmée : Atelier pain perdu/);
  assert.match(client.text, /Participants : 2/);
  assert.match(client.text, /Montant payé : 90,00\s€/);
  assert.equal(envoyes.find(m => m.to === 'julie@exemple.fr')!.replyTo, 'camille@example.com');
});

test('une demande de devis envoie le détail à Julie (réponse directe au client) et un accusé, sans HTML injecté', async () => {
  const { cookie } = await inscrire('devis-mail@example.com', '0600000002');
  await envoi.attendreLesEnvois();
  envoyes.length = 0; // l'e-mail de vérification de l'inscription n'est pas l'objet du test
  const message = '<img src=x onerror=alert(1)> Team building';
  const reponse = await devis.createDevis(requete('/api/devis', { cookie, methode: 'POST', corps: { entreprise: 'Acme', typeDemande: 'evenement', lieuSouhaite: 'a_proximite', message } }));
  assert.equal(reponse.status, 201);
  await envoi.attendreLesEnvois();

  const pourJulie = envoyes.find(m => m.to === 'julie@exemple.fr')!;
  const accuse = envoyes.find(m => m.to === 'devis-mail@example.com')!;
  assert.match(pourJulie.subject, /Nouvelle demande de devis : Acme/);
  assert.equal(pourJulie.replyTo, 'devis-mail@example.com');
  assert.match(pourJulie.text, /Téléphone : 0600000002/);
  assert.match(pourJulie.text, /Lieu : Dans un lieu proche de nos locaux/);
  assert.ok(!pourJulie.html.includes('<img') && pourJulie.html.includes('&lt;img src=x'));
  assert.match(accuse.subject, /bien reçu/);
});

test('un serveur SMTP en panne n’empêche pas d’enregistrer le paiement', async t => {
  t.mock.method(console, 'error', () => undefined);
  envoi.utiliserTransport(nodemailer.createTransport({ name: 'panne', version: '1', send: (mail, fin) => fin(new Error('SMTP indisponible'), { envelope: mail.message.getEnvelope(), messageId: '' }) }));
  try {
    const { reservation, envoyer } = await paiementReussi('cs_test_mail_panne');
    assert.equal((await envoyer()).status, 200);
    await envoi.attendreLesEnvois();
    assert.equal((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).statut, 'payee');
  } finally {
    envoi.utiliserTransport(transportMemoire());
  }
});

/** Appel d'une route Better Auth (/api/auth/…), comme le ferait le navigateur. */
function routeAuth(chemin: string, corps?: unknown) {
  return auth.handler(new Request(`${BASE}/api/auth${chemin}`, corps === undefined
    ? { headers: { origin: BASE } }
    : { method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify(corps) }));
}

const lienDuMail = (mail: Envoye) => mail.text.match(/https?:\/\/\S+/)![0];

test('mot de passe oublié : lien par e-mail, nouveau mot de passe accepté, ancien refusé, aucune fuite sur les adresses', async () => {
  await inscrire('oubli@example.com');
  await envoi.attendreLesEnvois();
  envoyes.length = 0;

  const demander = (email: string) => routeAuth('/request-password-reset', { email, redirectTo: '/reinitialiser-mot-de-passe' });
  const connu = await demander('oubli@example.com');
  const inconnu = await demander('personne@example.com');
  assert.equal(connu.status, 200);
  assert.deepEqual([inconnu.status, await inconnu.json()], [200, await connu.json()]);
  await envoi.attendreLesEnvois();
  assert.deepEqual(envoyes.map(m => m.to), ['oubli@example.com']);

  const token = lienDuMail(envoyes[0]).match(/reset-password\/([^?\s]+)/)![1];
  assert.equal((await routeAuth('/reset-password', { newPassword: 'nouveau-motdepasse', token })).status, 200);
  assert.equal((await routeAuth('/sign-in/email', { email: 'oubli@example.com', password: 'motdepasse-de-test' })).status, 401);
  assert.equal((await routeAuth('/sign-in/email', { email: 'oubli@example.com', password: 'nouveau-motdepasse' })).status, 200);
  assert.equal((await routeAuth('/reset-password', { newPassword: 'encore-un-autre', token })).status, 400); // lien à usage unique
});

test('l’inscription envoie un lien qui vérifie l’adresse e-mail', async () => {
  const { id } = await inscrire('verif@example.com');
  await envoi.attendreLesEnvois();
  const mail = envoyes.find(m => m.to === 'verif@example.com' && /Confirmez/.test(m.subject))!;
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id } })).emailVerified, false);

  const lien = new URL(lienDuMail(mail));
  await auth.handler(new Request(lien, { headers: { origin: BASE } }));
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id } })).emailVerified, true);
});

test('la page de succès enregistre le paiement confirmé par Stripe ; le webhook arrivé ensuite ne refait rien', async () => {
  const { reservation, paye, envoyer } = await paiementReussi('cs_test_succes_avant_webhook');
  const stripeRenvoyant = (session: object) => ({ checkout: { sessions: { retrieve: async () => session } } }) as unknown as Stripe;
  const etat = async () => {
    const r = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id }, include: { session: true } });
    return { statut: r.statut, placesPrises: r.session.placesPrises };
  };

  // Stripe n'a pas encore encaissé : rien n'est enregistré.
  assert.equal(await bookings.confirmerPaiementDepuisStripe(paye.id, stripeRenvoyant({ ...paye, status: 'open', payment_status: 'unpaid' })), false);
  assert.deepEqual(await etat(), { statut: 'en_attente', placesPrises: 0 });

  // Arrivée sur la page de succès, Stripe confirme : même traitement que le webhook.
  assert.equal(await bookings.confirmerPaiementDepuisStripe(paye.id, stripeRenvoyant(paye)), true);
  assert.deepEqual(await etat(), { statut: 'payee', placesPrises: 2 });

  // Le webhook arrive ensuite : ni double comptage des places, ni second e-mail.
  assert.equal((await envoyer()).status, 200);
  await envoi.attendreLesEnvois();
  assert.deepEqual(await etat(), { statut: 'payee', placesPrises: 2 });
  assert.deepEqual(envoyes.map(m => m.to).sort(), ['camille@example.com', 'julie@exemple.fr']);
});
