import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
  // Démonstration uniquement. Les upserts ne remplacent pas les contenus existants.
  const experiences = [
    { slug: 'atelier-cuisine-anti-gaspi', type: 'atelier', titre: 'Atelier cuisine anti-gaspi', accroche: 'Cuisiner avec ce qu’on jette d’habitude', dureeMin: 150, prixCents: 4500 },
    { slug: 'good-tour-marche-producteurs', type: 'good_tour', titre: 'Good tour : marché et producteurs', accroche: 'À la rencontre de celles et ceux qui nous nourrissent', dureeMin: 180, prixCents: 3500 },
    { slug: 'immersion-producteur', type: 'immersion', titre: 'Immersion chez un producteur', accroche: 'Découvrir un métier au fil d’une journée', dureeMin: 240, prixCents: 6500 },
  ];

  for (const data of experiences) {
    const experience = await prisma.experience.upsert({
      where: { slug: data.slug },
      update: {},
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

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
