import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { hacherMotDePasse, LONGUEUR_MIN_MOT_DE_PASSE } from '../src/backend/auth/mot-de-passe';
import { creerTextesManquants } from '../src/backend/contenus/textes-par-defaut';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function creerExperiences() {
  // Démonstration uniquement. Les upserts ne remplacent pas les contenus existants,
  // sauf reservableEnLigne (ajouté après coup) : les immersions se réservent sur devis.
  const experiences = [
    { slug: 'atelier-cuisine-anti-gaspi', type: 'atelier', titre: 'Atelier cuisine anti-gaspi', accroche: 'Cuisiner avec ce qu’on jette d’habitude', dureeMin: 150, prixCents: 4500, reservableEnLigne: true },
    { slug: 'good-tour-marche-producteurs', type: 'good_tour', titre: 'Good tour : marché et producteurs', accroche: 'À la rencontre de celles et ceux qui nous nourrissent', dureeMin: 180, prixCents: 3500, reservableEnLigne: true },
    { slug: 'immersion-producteur', type: 'immersion', titre: 'Immersion chez un producteur', accroche: 'Découvrir un métier au fil d’une journée', dureeMin: 240, prixCents: 6500, reservableEnLigne: false },
  ];

  for (const data of experiences) {
    const experience = await prisma.experience.upsert({
      where: { slug: data.slug },
      update: { reservableEnLigne: data.reservableEnLigne },
      create: {
        ...data,
        description: `${data.accroche}. Contenu de démonstration à remplacer.`,
        capaciteMax: 12,
        lieu: 'La Rochelle',
        image: '',
        imageAlt: '',
      },
    });

    const existing = await prisma.session.findFirst({ where: { experienceId: experience.id } });
    if (!existing) {
      const dateDebut = new Date();
      dateDebut.setUTCDate(dateDebut.getUTCDate() + 30);
      dateDebut.setUTCHours(10, 0, 0, 0);
      await prisma.session.create({
        data: {
          experienceId: experience.id,
          dateDebut,
          dateFin: new Date(dateDebut.getTime() + data.dureeMin * 60_000),
          lieu: 'La Rochelle',
          placesTotal: 12,
        },
      });
    }
  }

  console.log('Données de démonstration créées : 3 expériences et leurs sessions.');
}

// Compte admin : identifiants lus dans .env.local, jamais écrits dans le code.
// Même format que Better Auth : le mot de passe haché vit dans un compte « credential ».
async function creerAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const motDePasse = process.env.ADMIN_PASSWORD;
  if (!email || !motDePasse) {
    console.warn('ADMIN_EMAIL ou ADMIN_PASSWORD absent de .env.local : compte admin non créé.');
    return;
  }
  if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
    throw new Error(`ADMIN_PASSWORD doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`);
  }

  const existant = await prisma.user.findUnique({ where: { email } });
  if (existant) {
    // Le mot de passe d'un compte existant n'est jamais remplacé par le seed.
    if (existant.role !== 'admin') await prisma.user.update({ where: { id: existant.id }, data: { role: 'admin' } });
    console.log(`Compte admin déjà présent : ${email}`);
    return;
  }

  const id = randomUUID();
  await prisma.user.create({
    data: {
      id, email, nom: 'Administration', role: 'admin', emailVerified: true,
      comptes: { create: { id: randomUUID(), accountId: id, providerId: 'credential', password: await hacherMotDePasse(motDePasse) } },
    },
  });
  console.log(`Compte admin créé : ${email}`);
}

// Textes fixes de l'accueil, d'À propos et du studio : textes d'origine, modifiables ensuite dans /admin/textes.
async function creerTextes() {
  const crees = await creerTextesManquants(prisma);
  const s = crees > 1 ? 's' : '';
  console.log(crees ? `Textes des pages : ${crees} texte${s} d'origine créé${s}.` : 'Textes des pages déjà présents (non modifiés).');
}

async function main() {
  await creerExperiences();
  await creerAdmin();
  await creerTextes();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
