import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { reservationsBloquantes } from '@/backend/places';

/** Chiffres de l'accueil de l'administration : ce qui demande l'attention de Julie. */
export async function chiffresTableauDeBord() {
  const maintenant = new Date();
  const [devisNouveaux, reservationsAVenir, paiementsEnAttente, sessionsOuvertes, clients] = await Promise.all([
    prisma.demandeDevis.count({ where: { statut: 'nouvelle' } }),
    prisma.reservation.count({ where: { statut: 'payee', session: { dateDebut: { gt: maintenant } } } }),
    prisma.reservation.count({ where: reservationsBloquantes() }),
    prisma.session.count({ where: { statut: 'ouverte', dateDebut: { gt: maintenant } } }),
    prisma.user.count({ where: { role: 'client' } }),
  ]);
  return { devisNouveaux, reservationsAVenir, paiementsEnAttente, sessionsOuvertes, clients };
}
