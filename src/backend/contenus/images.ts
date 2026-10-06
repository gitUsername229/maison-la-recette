import 'server-only';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exigerAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json } from '@/backend/http';
import { routesRessource } from './crud';
import { imageSchemas } from './validation';

const DOSSIER_PUBLIC = '/images/uploads/';
const TAILLE_MAX = 5 * 1024 * 1024;

// Le type est déduit des premiers octets du fichier, jamais du nom ou du type annoncé.
const FORMATS = [
  { extension: 'jpg', signature: (o: Uint8Array) => o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff },
  { extension: 'png', signature: (o: Uint8Array) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => o[i] === b) },
  { extension: 'webp', signature: (o: Uint8Array) => ascii(o, 0, 4) === 'RIFF' && ascii(o, 8, 12) === 'WEBP' },
];

function ascii(octets: Uint8Array, debut: number, fin: number) {
  return String.fromCharCode(...octets.subarray(debut, fin));
}

const cheminDisque = (url: string) => join(process.cwd(), 'public', url);

/**
 * Supprime un fichier envoyé depuis l'admin s'il n'est plus utilisé nulle part sur le site
 * (photo, couverture d'expérience ou d'article, photo de partenaire). À appeler après l'enregistrement.
 */
export async function supprimerFichierOrphelin(url: string | null) {
  if (!url?.startsWith(DOSSIER_PUBLIC)) return;
  const utilisations = await Promise.all([
    prisma.image.count({ where: { url } }),
    prisma.experience.count({ where: { image: url } }),
    prisma.article.count({ where: { image: url } }),
    prisma.partenaire.count({ where: { photo: url } }),
  ]);
  if (utilisations.every(n => n === 0)) await unlink(cheminDisque(url)).catch(() => undefined);
}

/** Photos de la galerie d'une page du site, dans l'ordre choisi par l'admin. */
export function imagesDePage(page: string) {
  return prisma.image.findMany({ where: { page }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }] });
}

/** Galerie : ?page=/a-propos pour les images d'une page, dans l'ordre choisi par l'admin. */
export const images = routesRessource({
  schemas: imageSchemas,
  lister: (_admin, params) => {
    const page = params.get('page');
    return page ? imagesDePage(page) : prisma.image.findMany({ orderBy: [{ page: 'asc' }, { ordre: 'asc' }] });
  },
  creer: data => prisma.image.create({ data }),
  modifier: async (id, data) => {
    const avant = await prisma.image.findUniqueOrThrow({ where: { id }, select: { url: true } });
    const image = await prisma.image.update({ where: { id }, data });
    // Photo remplacée : l'ancien fichier est supprimé s'il ne sert plus nulle part.
    if (image.url !== avant.url) await supprimerFichierOrphelin(avant.url);
    return image;
  },
  supprimer: async id => {
    const image = await prisma.image.delete({ where: { id } });
    await supprimerFichierOrphelin(image.url);
  },
});

/** POST /api/images/fichier (admin) : enregistre une photo dans public/images/uploads/ et renvoie son chemin. */
export const envoyerFichier = endpoint(async (request: Request) => {
  await exigerAdmin(request);
  if (Number(request.headers.get('content-length')) > TAILLE_MAX + 64 * 1024) throw new ApiError(400, 'Image trop lourde (5 Mo maximum)');
  const fichier = (await request.formData()).get('fichier');
  if (!(fichier instanceof File) || fichier.size === 0) throw new ApiError(400, 'Aucun fichier reçu');
  if (fichier.size > TAILLE_MAX) throw new ApiError(400, 'Image trop lourde (5 Mo maximum)');

  const octets = new Uint8Array(await fichier.arrayBuffer());
  const format = FORMATS.find(f => f.signature(octets));
  if (!format) throw new ApiError(400, 'Format non accepté : JPG, PNG ou WebP uniquement');

  const url = `${DOSSIER_PUBLIC}${randomUUID()}.${format.extension}`;
  await writeFile(cheminDisque(url), octets);
  return json({ url }, 201);
});
