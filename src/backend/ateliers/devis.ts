import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { enArrierePlan } from '@/backend/mails/envoi';
import { envoyerMailsDevis } from '@/backend/mails/notifications';
import { limiterDebit, lirePiege } from '@/backend/anti-spam';
import { ApiError, endpoint, json } from '@/backend/http';
import { devisSchema } from './validation';

/** Réponse identique pour toute demande acceptée : aucun identifiant interne n'est communiqué au visiteur. */
const MERCI_DEVIS = 'Merci ! Julie vous rappelle sous 48 h pour en parler.';

/** POST /api/devis (public, sans compte) : nom, entreprise, e-mail et téléphone saisis dans le formulaire. */
export const createDevis = endpoint(async (request: Request) => {
  limiterDebit(request, 'devis');
  const { robot, donnees } = lirePiege(await request.json());
  // Robot : même réponse qu'une vraie demande, mais rien n'est enregistré ni envoyé.
  if (robot) return json({ message: MERCI_DEVIS }, 201);
  const { nom, consentement: consentementLe, ...data } = devisSchema.parse(donnees);
  if (data.dateSouhaitee && data.dateSouhaitee < new Date()) throw new ApiError(400, 'La date souhaitée doit être future');
  if (data.typeDemande !== 'experience' && data.experience) throw new ApiError(400, 'Seule une demande « expérience » peut viser une expérience');
  const devis = await prisma.demandeDevis.create({ data: { ...data, contactNom: nom, consentementLe }, select: { id: true } });
  enArrierePlan(envoyerMailsDevis(devis.id));
  return json({ message: MERCI_DEVIS }, 201);
});
