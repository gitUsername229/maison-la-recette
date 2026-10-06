import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import nodemailer from 'nodemailer';
import { preparerBaseDeTest } from './outils';

type Envoye = { to: string; subject: string; html: string; text: string; replyTo?: string };

const envoyes: Envoye[] = [];
let nettoyer: () => Promise<void>;
let envoi: typeof import('../src/backend/mails/envoi');
let modeles: typeof import('../src/backend/mails/modeles');

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
  envoi.utiliserTransport(transportMemoire());
});

beforeEach(() => { envoyes.length = 0; });

after(async () => {
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
