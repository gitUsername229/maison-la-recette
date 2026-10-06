import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

/** Inscription par la vraie route Better Auth ; renvoie le cookie de session et l'id du compte. */
export async function inscrire(email: string, telephone?: string) {
  const { auth } = await import('../src/backend/auth/auth');
  const { prisma } = await import('../src/backend/db/prisma');
  const corps = { name: `Client ${email}`, email, password: 'motdepasse-de-test', ...(telephone ? { telephone } : {}) };
  const reponse = await auth.handler(new Request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify(corps),
  }));
  assert.equal(reponse.status, 200);
  const cookie = reponse.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const utilisateur = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { cookie, id: utilisateur.id };
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
