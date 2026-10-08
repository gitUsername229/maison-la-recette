import 'server-only';
import { z } from 'zod';
import { consentement, limiterDebit, lirePiege } from '@/backend/anti-spam';
import { prisma } from '@/backend/db/prisma';
import { endpoint, json } from '@/backend/http';

// Adresse nettoyée (espaces, majuscules) avant d'être validée.
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const inscriptionPubliqueSchema = z.object({ email, consentement }).strict();

const MERCI = 'Merci ! Votre adresse est inscrite à la newsletter.';

/**
 * POST /api/newsletter (public). Même réponse que l'adresse soit déjà inscrite ou non : on ne révèle pas
 * qui est abonné. Champ piège, limite d'envois par IP et consentement obligatoire (sa date est enregistrée).
 */
export const inscrire = endpoint(async (request: Request) => {
  limiterDebit(request, 'newsletter');
  const { robot, donnees } = lirePiege(await request.json());
  // Robot : même réponse, rien n'est enregistré.
  if (robot) return json({ message: MERCI }, 201);
  const { email, consentement: consentementLe } = inscriptionPubliqueSchema.parse(donnees);
  await prisma.newsletter.upsert({ where: { email }, update: { consentementLe }, create: { email, consentementLe } });
  return json({ message: MERCI }, 201);
});
