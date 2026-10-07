import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { envoyerMail, type Mail } from './envoi';
import { accuseDevis, confirmationReservation, devisPourJulie, reservationPourJulie } from './modeles';

/** E-mail destiné à Julie (MAIL_ADMIN_TO), ou rien si l'adresse n'est pas configurée. */
function pourJulie(creer: (adresse: string) => Mail): Mail[] {
  const adresse = process.env.MAIL_ADMIN_TO;
  if (adresse) return [creer(adresse)];
  console.warn('[e-mail] MAIL_ADMIN_TO absent : Julie n’est pas prévenue.');
  return [];
}

/** Paiement confirmé : confirmation au client et information à Julie. */
export async function envoyerMailsReservationPayee(id: number) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id },
    select: { id: true, nom: true, email: true, telephone: true, nbPersonnes: true, montantCents: true, session: { select: { dateDebut: true, lieu: true, experience: { select: { titre: true, slug: true } } } } },
  });
  await Promise.all([confirmationReservation(reservation), ...pourJulie(a => reservationPourJulie(a, reservation))].map(envoyerMail));
}

/** Nouvelle demande de devis : détail à Julie (réponse directe au client) et accusé de réception. */
export async function envoyerMailsDevis(id: number) {
  const devis = await prisma.demandeDevis.findUniqueOrThrow({
    where: { id },
    select: { id: true, entreprise: true, contactNom: true, email: true, telephone: true, typeDemande: true, nbParticipants: true, dateSouhaitee: true, lieuSouhaite: true, message: true, experience: { select: { titre: true } } },
  });
  await Promise.all([...pourJulie(a => devisPourJulie(a, devis)), accuseDevis(devis)].map(envoyerMail));
}
