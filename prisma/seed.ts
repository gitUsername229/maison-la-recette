import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { hacherMotDePasse, LONGUEUR_MIN_MOT_DE_PASSE } from '../src/backend/auth/mot-de-passe';
import { creerTextesManquants } from '../src/backend/contenus/textes-par-defaut';
import { creerArticlesDemo } from './articles-demo';
import { poserPhotosDemo } from './images-demo';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function creerExperiences() {
  // Démonstration uniquement. Les upserts ne remplacent pas les contenus existants,
  // sauf reservableEnLigne (ajouté après coup) : les immersions se réservent sur devis.
  const experiences = [
    { slug: 'atelier-cuisine-anti-gaspi', type: 'atelier', titre: 'Atelier cuisine anti-gaspi', accroche: 'Cuisiner avec ce qu’on jette d’habitude', dureeMin: 150, prixCents: 4500, reservableEnLigne: true },
    { slug: 'good-tour-marche-producteurs', type: 'good_tour', titre: 'Food tour : marché et producteurs', accroche: 'À la rencontre de celles et ceux qui nous nourrissent', dureeMin: 180, prixCents: 3500, reservableEnLigne: true },
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

// Articles de démonstration du blog (à remplacer), liés aux expériences du seed et au dernier épisode importé.
async function creerArticles() {
  const { crees, sansEpisode } = await creerArticlesDemo(prisma);
  console.log(crees ? `Blog : ${crees} article${crees > 1 ? 's' : ''} de démonstration créé${crees > 1 ? 's' : ''}.` : 'Blog : articles de démonstration déjà présents (non modifiés).');
  if (crees && sansEpisode) console.warn('Aucun épisode importé : l’article « coulisses » n’est lié à aucun épisode. Importez-les depuis /admin/episodes, puis liez-le.');
}

// Avis de démonstration : prénoms et témoignages inventés, dates récentes, marqués « démo » dans /admin/avis pour être
// supprimés avant la mise en ligne. Un avis déjà présent (même nom, même témoignage) n'est jamais recréé.
const AVIS_DEMO = [
  { nom: 'Claire, 52 ans', citation: 'On est reparti avec des recettes, des adresses et l’envie de cuisiner autrement.', contexte: 'Atelier cuisine anti-gaspi', note: 5, joursAvant: 12 },
  { nom: 'Mathieu, 40 ans', citation: 'Une matinée passionnante à la rencontre des producteurs du marché.', contexte: 'Food tour : marché et producteurs', note: 4, joursAvant: 26 },
  { nom: 'Inès, 34 ans', citation: 'Convivial, concret et plein d’astuces pour ne plus rien jeter.', contexte: 'Atelier cuisine anti-gaspi', note: 5, joursAvant: 41 },
];

async function creerAvis() {
  let crees = 0;
  for (const { joursAvant, ...avis } of AVIS_DEMO) {
    if (await prisma.avis.findFirst({ where: { nom: avis.nom, citation: avis.citation } })) continue;
    await prisma.avis.create({ data: { ...avis, date: new Date(Date.now() - joursAvant * 86_400_000), demo: true, visible: true } });
    crees += 1;
  }
  console.log(crees ? `Avis : ${crees} avis de démonstration créé${crees > 1 ? 's' : ''} (marqués « démo »).` : 'Avis : avis de démonstration déjà présents (non modifiés).');
}

// Photos de démonstration (Unsplash, provisoires) : couvertures vides et pages sans galerie seulement.
async function poserPhotos() {
  const { couvertures, galeries } = await poserPhotosDemo(prisma);
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  console.log(couvertures || galeries
    ? `Photos de démonstration : ${pluriel(couvertures, 'couverture')}, ${pluriel(galeries, 'galerie')}.`
    : 'Photos déjà en place (non modifiées).');
}

async function main() {
  await creerExperiences();
  await creerAdmin();
  await creerTextes();
  await creerArticles();
  await creerAvis();
  await poserPhotos();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
