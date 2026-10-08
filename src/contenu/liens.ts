// Liens extérieurs du site.

/** Calendrier Luma de la cliente : lien de secours quand les événements ne peuvent pas être lus, et « Voir tout ». */
export const LIEN_LUMA = 'https://luma.com/larecette';

/** Réseaux sociaux, en tête de la seconde colonne du pied de page (nouvel onglet). */
export const RESEAUX_SOCIAUX = [
  { nom: 'Instagram', url: 'https://instagram.com/larecette_maison' },
  { nom: 'LinkedIn', url: 'https://linkedin.com/in/julie-van-ossel-3497421a' },
] as const;

/** Espace de gestion du podcast chez Ausha : raccourci du tableau de bord privé (/tableau-de-bord). */
export const LIEN_AUSHA = 'https://app.ausha.co/';

/**
 * Webmail de Julie, où arrivent les devis et les inscriptions (MAIL_ADMIN_TO) : raccourci du tableau de bord.
 * À renseigner à la mise en ligne (ex : l'adresse de la messagerie de Julie) ; vide, le raccourci est masqué.
 * En développement, le raccourci mène toujours à Mailpit (http://localhost:8025).
 */
export const LIEN_BOITE_MAIL = '';
