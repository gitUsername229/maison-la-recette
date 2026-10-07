import 'server-only';

// Adresse publique du site (NEXT_PUBLIC_BASE_URL) : liens des e-mails, balises des moteurs de recherche, sitemap.

export const NOM_DU_SITE = 'Maison La recette';

/** Adresse publique pour écrire à Julie (page de succès, e-mails de confirmation). */
export const EMAIL_DE_CONTACT = 'larecette@ecomail.fr';

export const adresseDuSite = () => new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000');

/** Adresse absolue d'une page du site, ex : urlDuSite('/admin/devis'). */
export const urlDuSite = (chemin: string) => new URL(chemin, adresseDuSite()).toString();
