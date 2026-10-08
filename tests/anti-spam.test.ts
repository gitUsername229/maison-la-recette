import assert from 'node:assert/strict';
import { createServer, request as requeteHttp } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let devis: typeof import('../src/backend/ateliers/devis');
let newsletter: typeof import('../src/backend/contenus/newsletter');
let antiSpam: typeof import('../src/backend/anti-spam');
let adresse: typeof import('../src/backend/adresse-ip');
let envoi: typeof import('../src/backend/mails/envoi');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  devis = await import('../src/backend/ateliers/devis');
  newsletter = await import('../src/backend/contenus/newsletter');
  antiSpam = await import('../src/backend/anti-spam');
  adresse = await import('../src/backend/adresse-ip');
  envoi = await import('../src/backend/mails/envoi');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

/** Une adresse IP différente par appel : chaque test a ses propres compteurs. */
let derniereIp = 0;
const nouvelleIp = () => `198.51.100.${++derniereIp}`;
const DEVIS = { nom: 'Sophie', entreprise: 'Acme', email: 'sophie@example.com', telephone: '0600000001', typeDemande: 'studio', message: 'Un podcast', consentement: true };
const envoyer = (route: 'devis' | 'newsletter', corps: unknown, ip = nouvelleIp()) => {
  const options = { methode: 'POST', corps, entetes: { 'x-forwarded-for': ip } };
  if (route === 'devis') return devis.createDevis(requete('/api/devis', options));
  return newsletter.inscrire(requete('/api/newsletter', options));
};

/** Variables d'environnement modifiées le temps d'un test. */
async function avecEnvironnement(valeurs: Record<string, string | undefined>, faire: () => Promise<void>) {
  const avant = Object.fromEntries(Object.keys(valeurs).map(cle => [cle, process.env[cle]]));
  const appliquer = (v: Record<string, string | undefined>) => {
    for (const [cle, valeur] of Object.entries(v)) {
      if (valeur === undefined) Reflect.deleteProperty(process.env, cle);
      else Object.assign(process.env, { [cle]: valeur });
    }
  };
  appliquer(valeurs);
  try { await faire(); } finally { appliquer(avant); }
}

test('champ piège rempli : devis et newsletter font semblant de réussir sans rien enregistrer', async () => {
  const devisRobot = await envoyer('devis', { ...DEVIS, email: 'robot@example.com', siteWeb: 'https://spam.example' });
  const devisHumain = await envoyer('devis', { ...DEVIS, email: 'humaine@example.com', siteWeb: '' });
  assert.deepEqual([devisRobot.status, await devisRobot.json()], [devisHumain.status, await devisHumain.json()]);
  assert.equal(await prisma.demandeDevis.count({ where: { email: 'robot@example.com' } }), 0);
  assert.equal(await prisma.demandeDevis.count({ where: { email: 'humaine@example.com' } }), 1);

  const lettreRobot = await envoyer('newsletter', { email: 'robot@example.com', consentement: true, siteWeb: 'x' });
  assert.equal(lettreRobot.status, 201);
  assert.equal(await prisma.newsletter.count({ where: { email: 'robot@example.com' } }), 0);

  await envoi.attendreLesEnvois();
});

test('consentement obligatoire sur les deux formulaires, et sa date enregistrée', async () => {
  const champs = async (reponse: Response) => ((await reponse.json()) as { details?: { champ: string; message: string }[] }).details ?? [];
  for (const [route, corps] of [
    ['devis', { ...DEVIS, consentement: undefined }],
    ['devis', { ...DEVIS, consentement: false }],
    ['newsletter', { email: 'lectrice@example.com' }],
  ] as const) {
    const reponse = await envoyer(route, corps);
    assert.equal(reponse.status, 400, route);
    assert.deepEqual(await champs(reponse), [{ champ: 'consentement', message: 'Cochez la case pour accepter la politique de confidentialité.' }]);
  }

  const avant = Date.now();
  assert.equal((await envoyer('devis', { ...DEVIS, email: 'consentie@example.com' })).status, 201);
  assert.ok((await prisma.demandeDevis.findFirstOrThrow({ where: { email: 'consentie@example.com' } })).consentementLe!.getTime() >= avant);
  assert.equal((await envoyer('newsletter', { email: 'consentie@example.com', consentement: true })).status, 201);
  assert.ok((await prisma.newsletter.findUniqueOrThrow({ where: { email: 'consentie@example.com' } })).consentementLe!.getTime() >= avant);
  await envoi.attendreLesEnvois();
});

test('limite d’envois par IP : 429 au-delà de la limite réglée, les autres adresses ne sont pas gênées, puis la période repart', async t => {
  await avecEnvironnement({ LIMITE_DEVIS: '2', LIMITE_NEWSLETTER: '1', LIMITE_PERIODE_MINUTES: '10' }, async () => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    const ip = nouvelleIp();
    assert.equal((await envoyer('devis', DEVIS, ip)).status, 201);
    assert.equal((await envoyer('devis', DEVIS, ip)).status, 201);
    const refus = await envoyer('devis', DEVIS, ip);
    assert.equal(refus.status, 429);
    assert.match(((await refus.json()) as { error: string }).error, /Réessayez dans 10 minutes/);
    assert.equal((await envoyer('devis', DEVIS)).status, 201); // une autre adresse

    // Chaque formulaire a son compteur ; même un envoi invalide compte (un robot ne peut pas insister).
    assert.equal((await envoyer('newsletter', { email: 'pas-une-adresse' }, ip)).status, 400);
    assert.equal((await envoyer('newsletter', { email: 'lecteur@example.com', consentement: true }, ip)).status, 429);

    t.mock.timers.tick(10 * 60_000);
    assert.equal((await envoyer('devis', DEVIS, ip)).status, 201);
  });
  await envoi.attendreLesEnvois();
});

test('limites par défaut : réglables, et 20 fois plus larges en développement', async () => {
  await avecEnvironnement({ NODE_ENV: 'production', LIMITE_DEVIS: undefined, LIMITE_PERIODE_MINUTES: undefined }, async () => {
    assert.deepEqual(antiSpam.reglageLimite('devis'), { limite: 5, periodeMs: 600_000 });
    assert.equal(antiSpam.reglageLimite('newsletter').limite, 5);
  });
  await avecEnvironnement({ NODE_ENV: 'development', LIMITE_DEVIS: undefined }, async () => {
    assert.equal(antiSpam.reglageLimite('devis').limite, 100);
  });
  await avecEnvironnement({ NODE_ENV: 'production', LIMITE_DEVIS: '50', LIMITE_PERIODE_MINUTES: '30' }, async () => {
    assert.deepEqual(antiSpam.reglageLimite('devis'), { limite: 50, periodeMs: 1_800_000 });
  });
});

test('adresse IP : x-forwarded-for n’est cru que derrière un proxy de confiance, sinon c’est l’IP de connexion', async () => {
  const ip = (valeur: string) => adresse.adresseIp(new Headers({ 'x-forwarded-for': valeur }));
  await avecEnvironnement({ PROXY_DE_CONFIANCE: undefined }, async () => {
    assert.equal(ip('192.0.2.7'), '192.0.2.7');
  });
  // Derrière un proxy : seule l'adresse qu'il a ajoutée compte, pas celle inventée par le visiteur avant elle.
  await avecEnvironnement({ PROXY_DE_CONFIANCE: '1' }, async () => {
    assert.equal(ip('1.1.1.1, 198.51.100.4'), '198.51.100.4');
  });
  await avecEnvironnement({ PROXY_DE_CONFIANCE: '2' }, async () => {
    assert.equal(ip('1.1.1.1, 198.51.100.4, 10.0.0.2'), '198.51.100.4');
  });

  // Sans proxy, le serveur retire l'en-tête envoyé par le visiteur avant que Next.js n'y écrive l'IP de connexion.
  await avecEnvironnement({ PROXY_DE_CONFIANCE: undefined }, async () => {
    adresse.ignorerEntetesIpDuVisiteur();
    const serveur = createServer((req, res) => res.end(JSON.stringify(req.headers)));
    await new Promise<void>(ok => serveur.listen(0, '127.0.0.1', ok));
    try {
      const recus = await new Promise<Record<string, string>>((ok, ko) => {
        const req = requeteHttp({ port: (serveur.address() as AddressInfo).port, host: '127.0.0.1', headers: { 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '1.2.3.4' } }, res => {
          let corps = '';
          res.on('data', morceau => { corps += morceau; });
          res.on('end', () => ok(JSON.parse(corps)));
        });
        req.on('error', ko);
        req.end();
      });
      assert.equal(recus['x-forwarded-for'], undefined);
      assert.equal(recus['x-real-ip'], undefined);
    } finally {
      serveur.close();
    }
  });
});
