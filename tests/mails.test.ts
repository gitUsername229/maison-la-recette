import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { preparerBaseDeTest, requete } from './outils';

type Envoye = { to: string; subject: string; html: string; text: string; replyTo?: string };

const envoyes: Envoye[] = [];
let nettoyer: () => Promise<void>;
let envoi: typeof import('../src/backend/mails/envoi');
let modeles: typeof import('../src/backend/mails/modeles');
let prisma: PrismaClient;
let devis: typeof import('../src/backend/ateliers/devis');

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
  devis = await import('../src/backend/ateliers/devis');
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
    lien: { texte: 'Voir', url: 'http://localhost:3000/experiences?a=1&b=2' },
  }));
  assert.equal(envoyes.length, 1);
  const [mail] = envoyes;
  assert.ok(!mail.html.includes('<script>') && mail.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(mail.html.includes('&quot;Acme&quot; &amp; fils'));
  assert.ok(mail.html.includes('href="http://localhost:3000/experiences?a=1&amp;b=2"'));
  assert.match(mail.text, /Entreprise : "Acme" & fils/);
});

test('un envoi en arrière-plan qui échoue est journalisé, sans erreur propagée', async t => {
  const journal = t.mock.method(console, 'error', () => undefined);
  envoi.enArrierePlan(Promise.reject(new Error('SMTP indisponible')));
  await envoi.attendreLesEnvois();
  assert.equal(journal.mock.callCount(), 1);
});

test('une demande de devis envoie le détail à Julie (réponse directe au client) et un accusé, sans HTML injecté', async () => {
  const message = '<img src=x onerror=alert(1)> Team building';
  const corps = { nom: 'Sophie', entreprise: 'Acme', email: 'devis-mail@example.com', telephone: '0600000002', typeDemande: 'evenement', lieuSouhaite: 'a_proximite', message, consentement: true };
  const reponse = await devis.createDevis(requete('/api/devis', { methode: 'POST', corps }));
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
  assert.ok(!accuse.text.includes('/compte'));
  assert.equal(accuse.replyTo, 'julie@exemple.fr');
});

test('devis pour une expérience : son slug est enregistré, son titre écrit dans l’e-mail', async () => {
  const corps = { nom: 'Léa', entreprise: 'Équipe Verte', email: 'experience@example.com', telephone: '0600000004', typeDemande: 'experience', experience: 'immersion-producteur', message: 'Une journée', consentement: true };
  assert.equal((await devis.createDevis(requete('/api/devis', { methode: 'POST', corps }))).status, 201);
  await envoi.attendreLesEnvois();
  assert.equal((await prisma.demandeDevis.findFirstOrThrow({ where: { email: 'experience@example.com' } })).experience, 'immersion-producteur');
  assert.match(envoyes.find(m => m.to === 'julie@exemple.fr')!.text, /Expérience : Immersion chez un producteur/);

  const inconnue = await devis.createDevis(requete('/api/devis', { methode: 'POST', corps: { ...corps, experience: 'inconnue' } }));
  assert.equal(inconnue.status, 400);
  assert.deepEqual((await inconnue.json() as { details: { champ: string }[] }).details.map(d => d.champ), ['experience']);
});

test('un serveur SMTP en panne n’empêche pas d’enregistrer la demande de devis', async t => {
  t.mock.method(console, 'error', () => undefined);
  envoi.utiliserTransport(nodemailer.createTransport({ name: 'panne', version: '1', send: (mail, fin) => fin(new Error('SMTP indisponible'), { envelope: mail.message.getEnvelope(), messageId: '' }) }));
  try {
    const corps = { nom: 'Sophie', entreprise: 'Panne SA', email: 'panne@example.com', telephone: '0600000003', typeDemande: 'studio', message: 'Un podcast', consentement: true };
    assert.equal((await devis.createDevis(requete('/api/devis', { methode: 'POST', corps }))).status, 201);
    await envoi.attendreLesEnvois();
    assert.equal(await prisma.demandeDevis.count({ where: { email: 'panne@example.com' } }), 1);
  } finally {
    envoi.utiliserTransport(transportMemoire());
  }
});

