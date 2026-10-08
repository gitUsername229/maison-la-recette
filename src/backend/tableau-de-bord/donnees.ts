import 'server-only';
import { TYPES_DEVIS } from '@/backend/ateliers/validation';
import { prisma } from '@/backend/db/prisma';
import { evenementsLuma, frequentationLuma, LIEN_LUMA, modeLuma, type EvenementAffiche } from '@/backend/luma/client';
import { compterParType, episodesAusha } from '@/backend/podcast/episodes';
import { LIEN_AUSHA, LIEN_BOITE_MAIL } from '@/contenu/liens';

// Chiffres du tableau de bord privé (/tableau-de-bord), à appeler seulement après la vérification de l'accès
// (pageTableauDeBord, src/backend/tableau-de-bord/acces.ts). Des chiffres agrégés uniquement : aucun nom,
// e-mail ni téléphone ne sort d'ici (pour les devis : date, type et entreprise, comme demandé par la cliente).
// Chaque bloc est lu à part : une source qui ne répond pas donne null, sans empêcher les autres de s'afficher.

const FUSEAU = 'Europe/Paris';

/** Prochains événements détaillés avec leurs inscrits (les suivants sont seulement comptés). */
const PROCHAINS_MAX = 6;

/** Minuit à Paris, le 1er du mois de `date` décalé de `decalage` mois (0 : ce mois-ci, -1 : le mois dernier). */
export function debutDuMois(date: Date, decalage = 0): Date {
  const [annee, mois] = date.toLocaleDateString('en-CA', { timeZone: FUSEAU }).split('-').map(Number);
  const approx = new Date(Date.UTC(annee, mois - 1 + decalage, 1));
  // Décalage de Paris ce jour-là (heure d'été ou d'hiver).
  const local = new Date(approx.toLocaleString('en-US', { timeZone: FUSEAU }));
  const utc = new Date(approx.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(approx.getTime() - (local.getTime() - utc.getTime()));
}

/** Lit un bloc ; null (et un message dans le terminal) si sa source ne répond pas. */
async function sansPanne<T>(bloc: string, lire: () => Promise<T>): Promise<T | null> {
  try {
    return await lire();
  } catch (erreur) {
    console.error(`[tableau de bord] ${bloc} illisible :`, erreur instanceof Error ? erreur.message : erreur);
    return null;
  }
}

const somme = (nombres: number[]) => nombres.reduce((total, n) => total + n, 0);

/**
 * Événements Luma : les prochains avec inscrits / places et taux de remplissage, puis, pour le mois en cours
 * (événements passés et à venir), le total des inscrits et le chiffre d'affaires estimé (prix × inscrits).
 */
async function blocLuma(maintenant: Date) {
  const [aVenir, passes] = await Promise.all([evenementsLuma('a-venir'), evenementsLuma('passes')]);
  if (!aVenir || !passes) return null;
  const [debut, fin] = [debutDuMois(maintenant), debutDuMois(maintenant, 1)];
  const duMois = [...passes.filter(e => e.debut >= debut), ...aVenir.filter(e => e.debut < fin)];
  const prochains = aVenir.slice(0, PROCHAINS_MAX);
  const ids = [...new Set([...duMois, ...prochains].map(e => e.id))];
  const frequentations = new Map(await Promise.all(ids.map(async id => [id, await frequentationLuma(id)] as const)));
  const chiffres = (e: EvenementAffiche) => {
    const { inscrits = null, capacite = null } = frequentations.get(e.id) ?? {};
    return { id: e.id, titre: e.titre, debut: e.debut, url: e.url, prix: e.prix, inscrits, capacite };
  };
  const mois = duMois.map(chiffres);
  const lus = mois.filter((e): e is typeof e & { inscrits: number } => e.inscrits !== null);
  const payants = lus.flatMap(e => (e.prix && e.prix.centimes > 0 ? [{ ...e, prix: e.prix }] : []));
  return {
    simulation: modeLuma() === 'simulation',
    prochains: prochains.map(e => {
      const { inscrits, capacite, ...reste } = chiffres(e);
      const remplissage = inscrits !== null && capacite ? Math.min(100, Math.round((inscrits / capacite) * 100)) : null;
      return { ...reste, inscrits, capacite, remplissage };
    }),
    autresAVenir: aVenir.length - prochains.length,
    mois: {
      evenements: mois.length,
      illisibles: mois.length - lus.length,          // événements dont Luma n'a pas donné les inscrits
      inscrits: somme(lus.map(e => e.inscrits)),
      chiffreAffaires: {
        centimes: somme(payants.map(e => e.prix.centimes * e.inscrits)),
        devise: payants[0]?.prix.devise ?? 'eur',
      },
    },
  };
}

/** Demandes de devis : ce mois-ci, le mois dernier, par type sur 12 mois, et les 5 dernières (date, type, entreprise). */
async function blocDevis(maintenant: Date) {
  const [debut, precedent, ilYaUnAn] = [debutDuMois(maintenant), debutDuMois(maintenant, -1), debutDuMois(maintenant, -11)];
  const [ceMois, moisPrecedent, parType, dernieres] = await Promise.all([
    prisma.demandeDevis.count({ where: { createdAt: { gte: debut } } }),
    prisma.demandeDevis.count({ where: { createdAt: { gte: precedent, lt: debut } } }),
    prisma.demandeDevis.groupBy({ by: ['typeDemande'], where: { createdAt: { gte: ilYaUnAn } }, _count: { _all: true } }),
    prisma.demandeDevis.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, createdAt: true, typeDemande: true, entreprise: true } }),
  ]);
  return {
    ceMois,
    moisPrecedent,
    parType: TYPES_DEVIS.map(type => ({ type, nombre: parType.find(g => g.typeDemande === type)?._count._all ?? 0 })),
    dernieres,
  };
}

/** Newsletter : nombre d'inscrits et nouveaux inscrits du mois. */
async function blocNewsletter(maintenant: Date) {
  const [total, ceMois] = await Promise.all([
    prisma.newsletter.count(),
    prisma.newsletter.count({ where: { createdAt: { gte: debutDuMois(maintenant) } } }),
  ]);
  return { total, ceMois };
}

/** Podcast : épisodes publiés dans le flux Ausha (par type) et date du dernier. */
async function blocPodcast() {
  const episodes = await episodesAusha();
  if (!episodes) return null;
  const dates = episodes.map(e => e.datePublication.getTime());
  return { total: episodes.length, parType: compterParType(episodes), dernier: dates.length ? new Date(Math.max(...dates)) : null };
}

/** Raccourcis : Luma, Ausha et la boîte mail (Mailpit en développement, masquée en production sans LIEN_BOITE_MAIL). */
function raccourcis() {
  const developpement = process.env.NODE_ENV !== 'production';
  const boiteMail = developpement ? 'http://localhost:8025' : LIEN_BOITE_MAIL;
  return [
    { nom: 'Luma', texte: 'Événements, inscriptions et paiements', url: LIEN_LUMA },
    { nom: 'Ausha', texte: 'Épisodes du podcast', url: LIEN_AUSHA },
    ...(boiteMail ? [{ nom: 'Boîte mail', texte: developpement ? 'Mailpit : les e-mails du site en local' : 'Devis et inscriptions à la newsletter', url: boiteMail }] : []),
  ];
}

/** Tous les blocs du tableau de bord, lus en parallèle ; un bloc illisible vaut null. */
export async function donneesTableauDeBord(maintenant = new Date()) {
  const [luma, devis, newsletter, podcast] = await Promise.all([
    sansPanne('Luma', () => blocLuma(maintenant)),
    sansPanne('devis', () => blocDevis(maintenant)),
    sansPanne('newsletter', () => blocNewsletter(maintenant)),
    sansPanne('podcast', () => blocPodcast()),
  ]);
  return { maintenant, luma, devis, newsletter, podcast, raccourcis: raccourcis(), lienLuma: LIEN_LUMA };
}

export type DonneesTableauDeBord = Awaited<ReturnType<typeof donneesTableauDeBord>>;
