import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

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
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, encoding: 'utf8' });
  assert.equal(migration.status, 0, migration.stderr);

  return async () => {
    if (resolve(dossier).startsWith(resolve(tmpdir()) + sep + PREFIXE)) await rm(dossier, { recursive: true, force: true });
  };
}
