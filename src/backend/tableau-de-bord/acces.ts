import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adresseIp } from '@/backend/adresse-ip';
import { compterEssai, minutes } from '@/backend/anti-spam';
import { ApiError, endpoint } from '@/backend/http';
import { donneesTableauDeBord } from './donnees';

// Accès au tableau de bord privé (/tableau-de-bord), sans compte : un seul mot de passe partagé, défini dans
// .env.local (TABLEAU_DE_BORD_MOT_DE_PASSE), jamais dans le code. Une fois le mot de passe validé, le navigateur
// reçoit un cookie httpOnly signé avec TABLEAU_DE_BORD_SECRET, valable 30 jours. La signature dépend aussi du
// mot de passe : en changer (ou changer le secret) invalide tous les cookies déjà donnés.

export const CHEMIN_TABLEAU_DE_BORD = '/tableau-de-bord';
export const COOKIE_TABLEAU_DE_BORD = 'tableau-de-bord';
/** Durée de validité du cookie, en secondes (30 jours). */
export const DUREE_ACCES_S = 30 * 24 * 60 * 60;
/** Tentatives de connexion par adresse IP : 5 par quart d'heure, même en développement. */
export const TENTATIVES = { limite: 5, periodeMs: 15 * 60_000 };
/** Longueur minimale du secret de signature (clé HMAC). */
const LONGUEUR_SECRET_MIN = 32;

/** En production, les valeurs factices de .env.example (publiées avec le code) ne valent rien. */
const factice = (valeur: string) => process.env.NODE_ENV === 'production' && /factice/i.test(valeur);

/** Mot de passe et secret lus dans l'environnement ; null tant que l'un manque (le tableau de bord reste fermé). */
function reglages() {
  const motDePasse = process.env.TABLEAU_DE_BORD_MOT_DE_PASSE ?? '';
  const secret = process.env.TABLEAU_DE_BORD_SECRET ?? '';
  if (!motDePasse || secret.length < LONGUEUR_SECRET_MIN || factice(motDePasse) || factice(secret)) return null;
  return { motDePasse, secret };
}

export const accesConfigure = () => reglages() !== null;

const empreinte = (texte: string) => createHash('sha256').update(texte, 'utf8').digest();

/** Comparaison en temps constant : on compare des empreintes de même longueur, quel que soit le texte saisi. */
export function motDePasseCorrect(saisi: string): boolean {
  const reglage = reglages();
  return reglage !== null && timingSafeEqual(empreinte(saisi), empreinte(reglage.motDePasse));
}

/** Signature d'une date d'expiration, avec une clé tirée du secret et du mot de passe. */
function signature(expiration: number, { motDePasse, secret }: { motDePasse: string; secret: string }) {
  const cle = createHmac('sha256', secret).update(motDePasse, 'utf8').digest();
  return createHmac('sha256', cle).update(`tableau-de-bord:${expiration}`).digest('base64url');
}

/** Valeur du cookie : « expiration.signature » (expiration en millisecondes). */
export function creerJeton(maintenant = Date.now()): string {
  const reglage = reglages();
  if (!reglage) throw new Error('Tableau de bord non configuré');
  const expiration = maintenant + DUREE_ACCES_S * 1000;
  return `${expiration}.${signature(expiration, reglage)}`;
}

/** Cookie valable : bien formé, non expiré, et signé avec le secret et le mot de passe actuels. */
export function jetonValide(jeton: string | undefined, maintenant = Date.now()): boolean {
  const reglage = reglages();
  const morceaux = /^(\d{1,16})\.([\w-]{43})$/.exec(jeton ?? '');
  if (!reglage || !morceaux) return false;
  const expiration = Number(morceaux[1]);
  if (expiration <= maintenant || expiration > maintenant + DUREE_ACCES_S * 1000) return false;
  return timingSafeEqual(Buffer.from(morceaux[2]), Buffer.from(signature(expiration, reglage)));
}

/**
 * Ce qu'affiche /tableau-de-bord : les chiffres avec un cookie valide ; sinon le formulaire de connexion, sans
 * avoir rien lu. `lire` : la lecture des chiffres (remplaçable dans les tests).
 */
export async function pageTableauDeBord(jeton: string | undefined, lire = donneesTableauDeBord) {
  if (!jetonValide(jeton)) return { autorise: false as const, configure: accesConfigure() };
  return { autorise: true as const, donnees: await lire() };
}

const optionsCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: CHEMIN_TABLEAU_DE_BORD,
  maxAge,
});

const connexionSchema = z.object({ motDePasse: z.string().max(200) }).strict();

/** POST /api/tableau-de-bord/connexion : { motDePasse } ; 401 s'il est faux, 429 après 5 tentatives en 15 minutes. */
export const connecter = endpoint(async (request: Request) => {
  if (!accesConfigure()) throw new ApiError(503, 'Le tableau de bord n’est pas encore configuré.');
  const attente = compterEssai(`tableau-de-bord:${adresseIp(request.headers)}`, TENTATIVES.limite, TENTATIVES.periodeMs);
  if (attente !== null) throw new ApiError(429, `Trop de tentatives depuis votre connexion. Réessayez dans ${minutes(attente)}.`);
  const { motDePasse } = connexionSchema.parse(await request.json());
  if (!motDePasseCorrect(motDePasse)) throw new ApiError(401, 'Mot de passe incorrect.', { champ: 'motDePasse' });
  const reponse = NextResponse.json({ message: 'Bienvenue.' }, { headers: { 'Cache-Control': 'no-store' } });
  reponse.cookies.set(COOKIE_TABLEAU_DE_BORD, creerJeton(), optionsCookie(DUREE_ACCES_S));
  return reponse;
});

/** POST /api/tableau-de-bord/deconnexion (bouton « Se déconnecter ») : efface le cookie, retour au formulaire. */
export const deconnecter = endpoint(async () => {
  const reponse = new NextResponse(null, { status: 303, headers: { Location: CHEMIN_TABLEAU_DE_BORD, 'Cache-Control': 'no-store' } });
  reponse.cookies.set(COOKIE_TABLEAU_DE_BORD, '', optionsCookie(0));
  return reponse;
});
