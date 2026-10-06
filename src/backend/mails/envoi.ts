import 'server-only';
import { after } from 'next/server';
import nodemailer, { type Transporter } from 'nodemailer';

export type Mail = {
  a: string;
  sujet: string;
  texte: string;
  html: string;
  repondreA?: string;
};

const EXPEDITEUR_PAR_DEFAUT = 'Maison La recette <site@maison-la-recette.local>';

let transport: Transporter | undefined;
let journalSeulement = false; // aucun SMTP configuré : e-mails seulement annoncés dans le terminal

/**
 * Connexion SMTP lue dans .env.local (Mailpit en local, un vrai fournisseur en production).
 * Sans SMTP_HOST, les e-mails sont seulement annoncés dans le terminal.
 */
function transportActuel(): Transporter {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  const port = Number(SMTP_PORT) || 587;
  journalSeulement = !SMTP_HOST;
  transport = SMTP_HOST
    ? nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {}) })
    : nodemailer.createTransport({ jsonTransport: true });
  return transport;
}

/** Remplace le transport (tests : transport en mémoire ou en échec). */
export function utiliserTransport(remplacant: Transporter | undefined) {
  transport = remplacant;
  journalSeulement = false;
}

export async function envoyerMail(mail: Mail) {
  await transportActuel().sendMail({
    from: process.env.MAIL_FROM || EXPEDITEUR_PAR_DEFAUT,
    to: mail.a,
    replyTo: mail.repondreA,
    subject: mail.sujet,
    text: mail.texte,
    html: mail.html,
  });
  if (journalSeulement) console.info(`[e-mail] SMTP_HOST absent, non envoyé : « ${mail.sujet} » à ${mail.a}`);
}

const enCours = new Set<Promise<void>>();

/**
 * Lance une tâche (un envoi d'e-mail) après la réponse HTTP, grâce à after() de Next.js :
 * ni Stripe ni l'utilisateur n'attendent l'envoi. Un échec est journalisé, jamais propagé :
 * un paiement ou un devis reste enregistré même si l'e-mail ne part pas.
 */
export function enArrierePlan(tache: Promise<unknown>) {
  const suivie: Promise<void> = tache
    .then(() => undefined, erreur => console.error('[e-mail] échec d’envoi :', erreur instanceof Error ? erreur.message : erreur))
    .finally(() => enCours.delete(suivie));
  enCours.add(suivie);
  try {
    after(suivie);
  } catch {
    // Hors d'une requête (tests, scripts) : la tâche se termine seule.
  }
}

/** Attend la fin des envois lancés en arrière-plan (tests). */
export async function attendreLesEnvois() {
  await Promise.all(enCours);
}
