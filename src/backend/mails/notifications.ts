import 'server-only';
import { prisma } from '@/backend/db/prisma';
import { EXPERIENCES } from '@/contenu/experiences';
import { envoyerMail, type Mail } from './envoi';
import { accuseDevis, devisPourJulie, newsletterPourJulie } from './modeles';

/** E-mail destiné à Julie (MAIL_ADMIN_TO), ou rien si l'adresse n'est pas configurée. */
function pourJulie(creer: (adresse: string) => Mail): Mail[] {
  const adresse = process.env.MAIL_ADMIN_TO;
  if (adresse) return [creer(adresse)];
  console.warn('[e-mail] MAIL_ADMIN_TO absent : Julie n’est pas prévenue.');
  return [];
}

/** Nouvelle demande de devis : détail à Julie (réponse directe au client) et accusé de réception. */
export async function envoyerMailsDevis(id: number) {
  const { experience, ...devis } = await prisma.demandeDevis.findUniqueOrThrow({
    where: { id },
    select: { id: true, entreprise: true, contactNom: true, email: true, telephone: true, typeDemande: true, nbParticipants: true, dateSouhaitee: true, lieuSouhaite: true, message: true, experience: true },
  });
  const titre = EXPERIENCES.find(e => e.slug === experience)?.titre ?? experience;
  const mail = { ...devis, experience: titre };
  await Promise.all([...pourJulie(a => devisPourJulie(a, mail)), accuseDevis(mail)].map(envoyerMail));
}

/** Nouvelle inscription à la newsletter : l'adresse à Julie (l'inscription reste enregistrée en base). */
export async function envoyerMailNewsletter(email: string, inscritLe: Date) {
  await Promise.all(pourJulie(a => newsletterPourJulie(a, email, inscritLe)).map(envoyerMail));
}
