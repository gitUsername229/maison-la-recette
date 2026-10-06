import 'server-only';
import { formatDate, formatDateHeure, formatPrix, libelle, LIEUX_DEVIS, TYPES_DEVIS } from '@/frontend/format';
import type { Mail } from './envoi';

const ENTITES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Neutralise le HTML d'un texte (nom, message de devis…) avant de l'insérer dans un e-mail. */
export const echapper = (texte: string) => texte.replace(/[&<>"']/g, c => ENTITES[c]);

/** Adresse absolue d'une page du site, pour les liens des e-mails. */
export const urlDuSite = (chemin: string) => new URL(chemin, process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').toString();

export type Contenu = {
  titre: string;
  paragraphes: string[];
  details?: [libelle: string, valeur: string][];
  lien?: { texte: string; url: string };
};

const STYLE = {
  page: 'margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#302c25',
  titre: 'font-family:Georgia,serif;font-size:26px;font-weight:normal;margin:0 0 16px',
  paragraphe: 'line-height:1.6;margin:0 0 12px;white-space:pre-line',
  libelle: 'padding:6px 12px 6px 0;color:#78716c;vertical-align:top;white-space:nowrap',
  valeur: 'padding:6px 0;white-space:pre-line',
  bouton: 'display:inline-block;background:#302c25;color:#faf7f2;padding:12px 20px;border-radius:999px;text-decoration:none',
};

function html({ titre, paragraphes, details = [], lien }: Contenu) {
  const lignes = details.map(([l, v]) => `<tr><td style="${STYLE.libelle}">${echapper(l)}</td><td style="${STYLE.valeur}">${echapper(v)}</td></tr>`).join('');
  return `<!doctype html><html lang="fr"><body style="${STYLE.page}"><div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-family:Georgia,serif;font-size:18px;margin:0 0 24px">Maison La recette</p>
<h1 style="${STYLE.titre}">${echapper(titre)}</h1>
${paragraphes.map(p => `<p style="${STYLE.paragraphe}">${echapper(p)}</p>`).join('\n')}
${lignes ? `<table style="border-collapse:collapse;margin:16px 0">${lignes}</table>` : ''}
${lien ? `<p style="margin:24px 0"><a href="${echapper(lien.url)}" style="${STYLE.bouton}">${echapper(lien.texte)}</a></p>` : ''}
</div></body></html>`;
}

function texte({ titre, paragraphes, details = [], lien }: Contenu) {
  return [
    titre, '', ...paragraphes,
    ...(details.length ? ['', ...details.map(([l, v]) => `${l} : ${v}`)] : []),
    ...(lien ? ['', `${lien.texte} : ${lien.url}`] : []),
    '', '— Maison La recette',
  ].join('\n');
}

/** Mise en page commune à tous les e-mails, en HTML et en texte brut. */
export function composer(a: string, sujet: string, contenu: Contenu, repondreA?: string): Mail {
  return { a, sujet, html: html(contenu), texte: texte(contenu), repondreA };
}

// --- Réservations et devis

export type ReservationMail = {
  id: number; nom: string; email: string; telephone: string | null; nbPersonnes: number; montantCents: number;
  session: { dateDebut: Date; lieu: string; experience: { titre: string } };
};

export type DevisMail = {
  id: number; entreprise: string; contactNom: string; email: string; telephone: string | null; typeDemande: string;
  nbParticipants: number | null; dateSouhaitee: Date | null; lieuSouhaite: string | null; message: string;
  experience: { titre: string } | null;
};

function detailsReservation(r: ReservationMail): [string, string][] {
  return [
    ['Expérience', r.session.experience.titre],
    ['Date', formatDateHeure(r.session.dateDebut)],
    ['Lieu', r.session.lieu],
    ['Participants', String(r.nbPersonnes)],
    ['Montant payé', formatPrix(r.montantCents)],
    ['Réservation', `n° ${r.id}`],
  ];
}

export function confirmationReservation(r: ReservationMail): Mail {
  return composer(r.email, `Réservation confirmée : ${r.session.experience.titre}`, {
    titre: 'Votre place est réservée',
    paragraphes: [`Bonjour ${r.nom},`, 'Merci ! Votre paiement est bien reçu : nous avons hâte de vous accueillir.'],
    details: detailsReservation(r),
    lien: { texte: 'Voir mes réservations', url: urlDuSite('/compte') },
  });
}

export function reservationPourJulie(a: string, r: ReservationMail): Mail {
  return composer(a, `Nouvelle réservation payée : ${r.session.experience.titre}`, {
    titre: 'Nouvelle réservation payée',
    paragraphes: [`${r.nom} vient de réserver et de payer en ligne.`],
    details: [['Client', r.nom], ['E-mail', r.email], ['Téléphone', r.telephone ?? '—'], ...detailsReservation(r)],
    lien: { texte: 'Voir les réservations', url: urlDuSite('/admin/reservations') },
  }, r.email);
}

function detailsDevis(d: DevisMail): [string, string][] {
  const lignes: [string, string | null][] = [
    ['Demande', libelle(TYPES_DEVIS, d.typeDemande)],
    ['Expérience', d.experience?.titre ?? null],
    ['Entreprise', d.entreprise],
    ['Participants', d.nbParticipants ? String(d.nbParticipants) : null],
    ['Date souhaitée', d.dateSouhaitee ? formatDate(d.dateSouhaitee) : null],
    ['Lieu', d.lieuSouhaite ? libelle(LIEUX_DEVIS, d.lieuSouhaite) : null],
    ['Message', d.message],
  ];
  // Les champs facultatifs laissés vides ne sont pas affichés.
  return lignes.filter((ligne): ligne is [string, string] => ligne[1] !== null);
}

export function devisPourJulie(a: string, d: DevisMail): Mail {
  return composer(a, `Nouvelle demande de devis : ${d.entreprise}`, {
    titre: 'Nouvelle demande de devis',
    paragraphes: [`${d.contactNom} attend votre appel (réponse promise sous 48 h). Répondre à cet e-mail lui écrit directement.`],
    details: [['Contact', d.contactNom], ['E-mail', d.email], ['Téléphone', d.telephone ?? '—'], ...detailsDevis(d)],
    lien: { texte: 'Voir les demandes de devis', url: urlDuSite('/admin/devis') },
  }, d.email);
}

export function accuseDevis(d: DevisMail): Mail {
  return composer(d.email, 'Nous avons bien reçu votre demande de devis', {
    titre: 'Demande bien reçue',
    paragraphes: [`Bonjour ${d.contactNom},`, 'Merci pour votre demande : Julie vous rappelle sous 48 h pour en parler. Voici ce que vous nous avez envoyé.'],
    details: detailsDevis(d),
    lien: { texte: 'Suivre mes demandes', url: urlDuSite('/compte') },
  });
}
