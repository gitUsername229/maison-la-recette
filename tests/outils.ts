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
  process.env.MAIL_ADMIN_TO = 'julie@exemple.fr';
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, encoding: 'utf8' });
  assert.equal(migration.status, 0, migration.stderr);

  return async () => {
    if (resolve(dossier).startsWith(resolve(tmpdir()) + sep + PREFIXE)) await rm(dossier, { recursive: true, force: true });
  };
}

type OptionsRequete = { methode?: string; corps?: unknown; entetes?: Record<string, string> };

/** Requête vers une route du site, avec un corps JSON facultatif. */
export function requete(chemin: string, { methode = 'GET', corps, entetes = {} }: OptionsRequete = {}) {
  return new Request(`${BASE}${chemin}`, {
    method: methode,
    headers: { 'content-type': 'application/json', ...entetes },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
}
