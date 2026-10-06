import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@/backend/db/prisma';
import { hacherMotDePasse, LONGUEUR_MIN_MOT_DE_PASSE, verifierMotDePasse } from './mot-de-passe';

// Comptes : e-mail + mot de passe (argon2id), session en base et cookie httpOnly.
// Le secret vient de BETTER_AUTH_SECRET (.env.local).
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: LONGUEUR_MIN_MOT_DE_PASSE,
    password: { hash: hacherMotDePasse, verify: verifierMotDePasse },
  },
  // Noms des délégués Prisma (voir prisma/schema.prisma).
  user: {
    modelName: 'user',
    fields: { name: 'nom' },
    additionalFields: {
      telephone: { type: 'string', required: false },
      // input: false → impossible de se donner le rôle admin à l'inscription.
      role: { type: 'string', required: false, defaultValue: 'client', input: false },
    },
  },
  session: { modelName: 'authSession' },
  account: { modelName: 'authAccount' },
  verification: { modelName: 'authVerification' },
  plugins: [nextCookies()],
});
