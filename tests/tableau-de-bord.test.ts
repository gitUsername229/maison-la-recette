import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { requete } from './outils';

// Protection du tableau de bord privé (/tableau-de-bord) : mot de passe partagé, cookie signé, limite de tentatives.

const MOT_DE_PASSE = 'fanes-de-carottes-2026';
const SECRET = 'secret-de-test-0123456789-abcdefghijklmnopqrstuvwxyz';

let acces: typeof import('../src/backend/tableau-de-bord/acces');

before(async () => {
  Object.assign(process.env, { TABLEAU_DE_BORD_MOT_DE_PASSE: MOT_DE_PASSE, TABLEAU_DE_BORD_SECRET: SECRET });
  acces = await import('../src/backend/tableau-de-bord/acces');
});

/** Une adresse IP différente par appel : chaque test a ses propres compteurs de tentatives. */
let derniereIp = 0;
const nouvelleIp = () => `203.0.113.${++derniereIp}`;
const connecter = (motDePasse: string, ip = nouvelleIp()) =>
  acces.connecter(requete('/api/tableau-de-bord/connexion', { methode: 'POST', corps: { motDePasse }, entetes: { 'x-forwarded-for': ip } }));

/** Valeur du cookie d'accès posé par une réponse. */
function cookieRecu(reponse: Response) {
  const valeur = /^tableau-de-bord=([^;]*)/.exec(reponse.headers.get('set-cookie') ?? '')?.[1];
  assert.ok(valeur, 'cookie d’accès absent');
  return valeur;
}

/** Lecture des chiffres factice, qui compte ses appels : aucun chiffre ne doit être lu sans accès. */
function lectureEspionne() {
  const lire = async () => { lire.appels += 1; return {} as never; };
  lire.appels = 0;
  return lire;
}

/** Variables d'environnement modifiées le temps d'un test. */
async function avecEnvironnement(valeurs: Record<string, string>, faire: () => Promise<void> | void) {
  const avant = Object.fromEntries(Object.keys(valeurs).map(cle => [cle, process.env[cle]]));
  Object.assign(process.env, valeurs);
  try {
    await faire();
  } finally {
    for (const [cle, valeur] of Object.entries(avant)) {
      if (valeur === undefined) Reflect.deleteProperty(process.env, cle);
      else Object.assign(process.env, { [cle]: valeur });
    }
  }
}

test('page refusée sans cookie : formulaire de connexion, aucun chiffre lu', async () => {
  const lire = lectureEspionne();
  for (const jeton of [undefined, '', 'bonjour']) {
    assert.deepEqual(await acces.pageTableauDeBord(jeton, lire), { autorise: false, configure: true });
  }
  assert.equal(lire.appels, 0);

  const jeton = cookieRecu(await connecter(MOT_DE_PASSE));
  assert.equal((await acces.pageTableauDeBord(jeton, lire)).autorise, true);
  assert.equal(lire.appels, 1);

  // Sans mot de passe ni secret dans l'environnement, le tableau de bord reste fermé, même avec un cookie.
  await avecEnvironnement({ TABLEAU_DE_BORD_SECRET: '' }, async () => {
    assert.deepEqual(await acces.pageTableauDeBord(jeton, lire), { autorise: false, configure: false });
    assert.equal((await connecter(MOT_DE_PASSE)).status, 503);
  });
  // En production, les valeurs factices de .env.example (publiques) laissent aussi le tableau de bord fermé.
  await avecEnvironnement({ NODE_ENV: 'production', TABLEAU_DE_BORD_MOT_DE_PASSE: 'mot-de-passe-factice' }, async () => {
    assert.equal((await acces.pageTableauDeBord(jeton, lire)).autorise, false);
    assert.equal((await connecter('mot-de-passe-factice')).status, 503);
  });
});

test('mauvais mot de passe refusé, sans cookie ; le bon donne un cookie httpOnly, SameSite strict, 30 jours', async () => {
  for (const essai of ['', 'fanes', MOT_DE_PASSE.toUpperCase(), `${MOT_DE_PASSE} `, MOT_DE_PASSE.slice(0, -1)]) {
    const reponse = await connecter(essai);
    assert.equal(reponse.status, 401, essai);
    assert.equal(reponse.headers.get('set-cookie'), null);
    assert.deepEqual(await reponse.json(), { error: 'Mot de passe incorrect.', details: [{ champ: 'motDePasse', message: 'Mot de passe incorrect.' }] });
  }

  const reponse = await connecter(MOT_DE_PASSE);
  assert.equal(reponse.status, 200);
  const cookie = reponse.headers.get('set-cookie') ?? '';
  for (const attribut of [/HttpOnly/i, /SameSite=Strict/i, /Max-Age=2592000/, /Path=\/tableau-de-bord/]) assert.match(cookie, attribut);
  assert.doesNotMatch(cookie, /Secure/i, 'en développement (http://localhost)');
  await avecEnvironnement({ NODE_ENV: 'production' }, async () => {
    assert.match((await connecter(MOT_DE_PASSE)).headers.get('set-cookie') ?? '', /Secure/i);
  });

  // « Se déconnecter » efface le cookie et revient au formulaire.
  const sortie = await acces.deconnecter();
  assert.equal(sortie.status, 303);
  assert.equal(sortie.headers.get('location'), '/tableau-de-bord');
  assert.match(sortie.headers.get('set-cookie') ?? '', /^tableau-de-bord=;.*Max-Age=0/i);
});

test('limite de tentatives : 5 par adresse IP en 15 minutes, puis refus même avec le bon mot de passe', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const ip = nouvelleIp();
  for (let i = 0; i < 5; i++) assert.equal((await connecter('pas-le-bon', ip)).status, 401);

  const bloquee = await connecter(MOT_DE_PASSE, ip);
  assert.equal(bloquee.status, 429);
  assert.equal(bloquee.headers.get('set-cookie'), null);
  assert.deepEqual(await bloquee.json(), { error: 'Trop de tentatives depuis votre connexion. Réessayez dans 15 minutes.' });

  assert.equal((await connecter(MOT_DE_PASSE, nouvelleIp())).status, 200, 'une autre adresse IP n’est pas bloquée');
  t.mock.timers.tick(14 * 60_000);
  assert.equal((await connecter(MOT_DE_PASSE, ip)).status, 429, 'toujours bloquée au bout de 14 minutes');
  t.mock.timers.tick(60_000);
  assert.equal((await connecter(MOT_DE_PASSE, ip)).status, 200, 'débloquée au bout de 15 minutes');
});

test('cookie falsifié, expiré ou d’avant un changement de mot de passe : refusé', async () => {
  const lire = lectureEspionne();
  const jeton = cookieRecu(await connecter(MOT_DE_PASSE));
  assert.equal(acces.jetonValide(jeton), true);
  const [expiration, signature] = jeton.split('.');
  const autreCaractere = signature.at(-1) === 'A' ? 'B' : 'A';
  let signeAilleurs = '';
  await avecEnvironnement({ TABLEAU_DE_BORD_SECRET: `${SECRET}-autre` }, () => { signeAilleurs = acces.creerJeton(); });

  for (const falsifie of [
    `${Number(expiration) + 86_400_000}.${signature}`,         // expiration repoussée
    `${expiration}.${signature.slice(0, -1)}${autreCaractere}`, // signature retouchée
    `${expiration}.${'A'.repeat(43)}`,
    `${expiration}.`, `.${signature}`, `${jeton}.0`, signature,
    signeAilleurs,                                              // signé avec un autre secret
  ]) {
    assert.equal((await acces.pageTableauDeBord(falsifie, lire)).autorise, false, falsifie);
  }
  assert.equal(lire.appels, 0);

  assert.equal(acces.jetonValide(jeton, Date.now() + 31 * 86_400_000), false, 'expiré après 30 jours');
  await avecEnvironnement({ TABLEAU_DE_BORD_MOT_DE_PASSE: 'nouveau-mot-de-passe-2027' }, () => {
    assert.equal(acces.jetonValide(jeton), false, 'mot de passe changé : ancien cookie refusé');
  });
  assert.equal(acces.jetonValide(jeton), true);
});
