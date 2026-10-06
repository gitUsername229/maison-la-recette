import 'server-only';
import { hash, verify } from '@node-rs/argon2';

// argon2id (algorithme par défaut de @node-rs/argon2). Utilisé par Better Auth et par le seed.

export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export function hacherMotDePasse(motDePasse: string) {
  return hash(motDePasse);
}

export function verifierMotDePasse({ hash: empreinte, password }: { hash: string; password: string }) {
  return verify(empreinte, password);
}
