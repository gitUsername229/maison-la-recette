import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { ApiError } from '@/backend/http';
import { auth } from './auth';

export type Role = 'client' | 'admin';

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  emailVerifie: boolean;
  role: Role;
};

type Verdict = { utilisateur: Utilisateur } | { refus: 401 | 403 };

const MESSAGES_REFUS = {
  401: 'Connectez-vous pour continuer.',
  403: 'Accès réservé à l’administration.',
} as const;

async function lireUtilisateur(entetes: Headers): Promise<Utilisateur | null> {
  const session = await auth.api.getSession({ headers: entetes });
  if (!session) return null;
  const { id, name, email, emailVerified, telephone, role } = session.user;
  return { id, nom: name, email, telephone: telephone ?? null, emailVerifie: emailVerified, role: role === 'admin' ? 'admin' : 'client' };
}

/** Seul contrôle d'accès du site : session valide, puis rôle suffisant. */
export async function verifierAcces(entetes: Headers, role: Role = 'client'): Promise<Verdict> {
  const utilisateur = await lireUtilisateur(entetes);
  if (!utilisateur) return { refus: 401 };
  if (role === 'admin' && utilisateur.role !== 'admin') return { refus: 403 };
  return { utilisateur };
}

/** Header x-admin-key : tests curl en développement uniquement, jamais en production. */
function cleDeveloppementValide(entetes: Headers): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const attendue = process.env.ADMIN_KEY;
  const recue = entetes.get('x-admin-key');
  if (!attendue || !recue) return false;
  const a = Buffer.from(attendue);
  const b = Buffer.from(recue);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Routes API : les refus deviennent des réponses JSON 401 / 403 (voir endpoint dans http.ts).

async function exigerRole(request: Request, role: Role): Promise<Utilisateur> {
  const verdict = await verifierAcces(request.headers, role);
  if ('refus' in verdict) throw new ApiError(verdict.refus, MESSAGES_REFUS[verdict.refus]);
  return verdict.utilisateur;
}

/** Utilisateur connecté (client ou admin). La clé de développement ne suffit pas. */
export function exigerConnexion(request: Request): Promise<Utilisateur> {
  return exigerRole(request, 'client');
}

export async function exigerAdmin(request: Request): Promise<void> {
  if (cleDeveloppementValide(request.headers)) return;
  await exigerRole(request, 'admin');
}

/** Pour les GET publics : un admin voit aussi les contenus masqués. */
export async function estAdmin(request: Request): Promise<boolean> {
  if (cleDeveloppementValide(request.headers)) return true;
  return 'utilisateur' in await verifierAcces(request.headers, 'admin');
}

/** Pour les routes ouvertes à tous, mais qui changent si l'on est connecté. */
export async function utilisateurOptionnel(request: Request): Promise<Utilisateur | null> {
  const verdict = await verifierAcces(request.headers);
  return 'utilisateur' in verdict ? verdict.utilisateur : null;
}
