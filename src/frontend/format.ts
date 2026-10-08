// Formats et libellés français partagés par les pages serveur et les composants client.

const FUSEAU = 'Europe/Paris';

export const formatPrix = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/** « 14 novembre 2026 » */
export const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSEAU });

/** « samedi 14 novembre à 10:00 » */
export const formatDateHeure = (date: Date | string) =>
  new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: FUSEAU });

/** 150 → « 2 h 30 », 180 → « 3 h », 45 → « 45 min » */
export function formatDuree(minutes: number) {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (!heures) return `${reste} min`;
  return reste ? `${heures} h ${String(reste).padStart(2, '0')}` : `${heures} h`;
}

// Titres d'épisodes : préfixe de type ou de série (« EXTRAIT 2 - », « REPLAY - », « CHAPITRE 1 - »…), retiré à l'affichage.
const PREFIXE_EPISODE = /^\s*(?:(?:extrait|teaser|replay|rediffusion|[ée]pisode complet|table-ronde|chapitre|partie)(?:\s*\d+)?\s*[-–:]\s*)+/i;
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/**
 * Titre d'épisode → nom de l'invité et sujet, affichés l'un sous l'autre (maquette) :
 * « Jean Marie Pédron, cueilleur d'algues : celui qui… » → « Jean Marie Pédron » / « Cueilleur d'algues : celui qui… » ;
 * « [EXTRAIT 1 - Jean-Marie Pédron ] - Les algues… » → « Jean-Marie Pédron » / « Les algues… ».
 * Sans nom reconnaissable au début, le titre entier sert de nom et le sujet est vide.
 */
export function decouperTitre(titre: string): { nom: string; sujet: string } {
  const reste = titre.replace(PREFIXE_EPISODE, '').trim();
  const crochets = /^\[[^\]]*?(?:-\s*([^\]]+?))?\s*\]\s*[-–]?\s*(.+)$/.exec(reste);
  if (crochets) return crochets[1] ? { nom: crochets[1], sujet: majuscule(crochets[2]) } : { nom: majuscule(crochets[2]), sujet: '' };
  // Une question (« Comment mieux manger, sans se ruiner ? ») ne se coupe pas à la virgule.
  const morceaux = (reste.endsWith('?') ? /^([^,:?]{3,45}?)(?: :| [-–]) (.+)$/ : /^([^,:?]{3,45}?)(?:,| :| [-–]) (.+)$/).exec(reste);
  if (morceaux) return { nom: morceaux[1].trim(), sujet: majuscule(morceaux[2].trim()) };
  return { nom: reste, sujet: '' };
}

export type Libelles = Record<string, string>;

export const TYPES_EXPERIENCE: Libelles = { atelier: 'Atelier', good_tour: 'Good tour', immersion: 'Immersion' };
export const STATUTS_RESERVATION: Libelles = { en_attente: 'En attente de paiement', payee: 'Payée', annulee: 'Annulée' };
export const STATUTS_DEVIS: Libelles = { nouvelle: 'Envoyée', en_cours: 'En cours de traitement', traitee: 'Traitée' };
export const STATUTS_SESSION: Libelles = { ouverte: 'Ouverte', complete: 'Fermée', annulee: 'Annulée' }; // complete : plus de réservation possible
export const TYPES_DEVIS: Libelles = {
  experience: 'Une expérience pour mon équipe',
  sponsoring: 'Sponsoriser le podcast',
  studio: 'Le studio podcast pour ma marque',
  evenement: 'Un événement',
};
export const LIEUX_DEVIS: Libelles = { dans_les_locaux: 'Dans nos locaux', a_proximite: 'Dans un lieu proche de nos locaux' };
export const TYPES_EPISODE: Libelles = { complet: 'Épisode complet', extrait: 'Extrait', replay: 'Replay' };

/** Libellé d'une valeur stockée en base (la valeur brute si elle est inconnue). */
export const libelle = (libelles: Libelles, valeur: string) => libelles[valeur] ?? valeur;

export const libelleType = (type: string) => libelle(TYPES_EXPERIENCE, type);
