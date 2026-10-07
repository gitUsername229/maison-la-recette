import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

export const BASE = 'http://localhost:3000';
const PREFIXE = 'maison-test-';

/**
 * Base SQLite jetable et migrée, plus les variables d'environnement des tests.
 * À appeler avant d'importer le moindre module backend. Renvoie la fonction de nettoyage.
 */
export async function preparerBaseDeTest() {
  const dossier = await mkdtemp(join(tmpdir(), PREFIXE));
  await writeFile(join(dossier, 'test.db'), '');
  process.env.DATABASE_URL = `file:${join(dossier, 'test.db').replaceAll('\\', '/')}`;
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_unit_tests';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_unit_tests';
  process.env.ADMIN_KEY = 'local-test-admin';
  process.env.BETTER_AUTH_SECRET = 'secret-de-test-local-uniquement-0123456789';
  process.env.MAIL_ADMIN_TO = 'julie@exemple.fr';
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, encoding: 'utf8' });
  assert.equal(migration.status, 0, migration.stderr);

  return async () => {
    if (resolve(dossier).startsWith(resolve(tmpdir()) + sep + PREFIXE)) await rm(dossier, { recursive: true, force: true });
  };
}

export const MOT_DE_PASSE_TEST = 'motdepasse-de-test';

/**
 * Compte créé en base, comme le fait le seed (aucune inscription n'est possible sur le site), puis connecté
 * par la vraie route Better Auth. `role: 'client'` simule un compte sans le rôle admin. Renvoie l'id et le cookie.
 */
export async function creerCompte(email: string, role: 'admin' | 'client' = 'admin') {
  const { prisma } = await import('../src/backend/db/prisma');
  const { hacherMotDePasse } = await import('../src/backend/auth/mot-de-passe');
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id, email, nom: `Compte ${email}`, role, emailVerified: true,
      comptes: { create: { id: randomUUID(), accountId: id, providerId: 'credential', password: await hacherMotDePasse(MOT_DE_PASSE_TEST) } },
    },
  });
  return { id, cookie: await connecter(email) };
}

/** Connexion par la vraie route Better Auth ; renvoie le cookie de session. */
export async function connecter(email: string, motDePasse = MOT_DE_PASSE_TEST) {
  const { auth } = await import('../src/backend/auth/auth');
  const reponse = await auth.handler(new Request(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify({ email, password: motDePasse }),
  }));
  assert.equal(reponse.status, 200);
  return reponse.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
}

type OptionsRequete = { cookie?: string; methode?: string; corps?: unknown; entetes?: Record<string, string> };

/** Requête vers une route du site, avec cookie de session et corps JSON facultatifs. */
export function requete(chemin: string, { cookie, methode = 'GET', corps, entetes = {} }: OptionsRequete = {}) {
  return new Request(`${BASE}${chemin}`, {
    method: methode,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...entetes },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
}
