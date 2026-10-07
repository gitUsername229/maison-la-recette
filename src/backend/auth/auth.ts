import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@/backend/db/prisma';
import { enArrierePlan, envoyerMail } from '@/backend/mails/envoi';
import { motDePasseOublie } from '@/backend/mails/modeles';
import { hacherMotDePasse, LONGUEUR_MIN_MOT_DE_PASSE, verifierMotDePasse } from './mot-de-passe';

// Comptes d'administration uniquement (les visiteurs n'en ont pas) : e-mail + mot de passe (argon2id),
// session en base et cookie httpOnly. Le secret vient de BETTER_AUTH_SECRET (.env.local).
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  emailAndPassword: {
    enabled: true,
    // Aucune inscription : /api/auth/sign-up/email répond 400. Les admins sont créés par le seed ou dans /admin/utilisateurs.
    disableSignUp: true,
    minPasswordLength: LONGUEUR_MIN_MOT_DE_PASSE,
    password: { hash: hacherMotDePasse, verify: verifierMotDePasse },
    // Mot de passe oublié : lien valable 1 h (par défaut), sessions ouvertes fermées après le changement.
    sendResetPassword: ({ user, url }) => envoyerMail(motDePasseOublie(user.name, user.email, url)),
    revokeSessionsOnPasswordReset: true,
  },
  // Noms des délégués Prisma (voir prisma/schema.prisma).
  user: {
    modelName: 'user',
    fields: { name: 'nom' },
    additionalFields: {
      // Vérifié à chaque accès (verifierAcces). input: false → jamais modifiable par une route Better Auth.
      role: { type: 'string', required: false, defaultValue: 'client', input: false },
    },
  },
  session: { modelName: 'authSession' },
  account: { modelName: 'authAccount' },
  verification: { modelName: 'authVerification' },
  // Envois après la réponse : la durée de la réponse ne révèle pas si une adresse a un compte.
  advanced: { backgroundTasks: { handler: enArrierePlan } },
  plugins: [nextCookies()],
});
