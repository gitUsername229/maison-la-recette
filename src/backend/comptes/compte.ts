import 'server-only';
import { exigerConnexion, type Utilisateur } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { endpoint, json } from '@/backend/http';

const champsReservation = {
  id: true, nbPersonnes: true, montantCents: true, statut: true, createdAt: true,
  session: { select: { dateDebut: true, lieu: true, experience: { select: { titre: true, slug: true } } } },
} as const;

const champsDevis = {
  id: true, typeDemande: true, entreprise: true, nbParticipants: true, dateSouhaitee: true, statut: true, createdAt: true,
  experience: { select: { titre: true } },
} as const;

/** Réservations et demandes de devis d'un compte, jamais celles d'un autre client. */
export async function espaceCompte(userId: string) {
  const [reservations, demandesDevis] = await Promise.all([
    prisma.reservation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: champsReservation }),
    prisma.demandeDevis.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: champsDevis }),
  ]);
  return { reservations, demandesDevis };
}

/** Réservation retrouvée après paiement : visible par son propriétaire (ou un admin) uniquement. */
export async function reservationApresPaiement(stripeSessionId: string, utilisateur: Utilisateur) {
  const reservation = await prisma.reservation.findUnique({ where: { stripeSessionId }, select: { ...champsReservation, nom: true, userId: true } });
  if (!reservation || (reservation.userId !== utilisateur.id && utilisateur.role !== 'admin')) return null;
  return reservation;
}

/** GET /api/compte : le compte connecté, ses réservations et ses demandes de devis. */
export const getCompte = endpoint(async (request: Request) => {
  const utilisateur = await exigerConnexion(request);
  return json({ utilisateur, ...await espaceCompte(utilisateur.id) });
});
