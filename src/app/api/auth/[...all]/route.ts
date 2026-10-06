import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/backend/auth/auth';

// Inscription, connexion, déconnexion et session : /api/auth/* (Better Auth).
export const runtime = 'nodejs';
export const { GET, POST } = toNextJsHandler(auth);
