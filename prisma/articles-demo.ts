import type { PrismaClient } from '@prisma/client';
import type { CategorieBlog } from '../src/backend/contenus/categories-blog';

// Trois articles de démonstration, un par catégorie principale. Ce sont des trames à remplacer :
// aucun fait, aucune citation ni recette n'est attribué à une personne ou à une entreprise réelle.

const AVERTISSEMENT = '> Contenu de démonstration à remplacer.';

type ArticleDemo = {
  slug: string;
  titre: string;
  extrait: string;
  contenu: string;
  categorie: CategorieBlog;
  experiences: string[];   // slugs des expériences du seed
  episode: boolean;        // lié au dernier épisode complet importé
  joursAvant: number;      // date de publication : il y a N jours
};

const ARTICLES: ArticleDemo[] = [
  {
    slug: 'retour-atelier-cuisine-anti-gaspi',
    titre: 'Retour sur un atelier cuisine anti-gaspi',
    extrait: 'Contenu de démonstration à remplacer : la trame d’un retour d’atelier, de l’accueil à la dégustation.',
    categorie: 'retours-experience',
    experiences: ['atelier-cuisine-anti-gaspi'],
    episode: false,
    joursAvant: 3,
    contenu: [
      AVERTISSEMENT,
      'Cet article montre la structure d’un retour d’atelier : remplacez chaque partie par ce qui s’est réellement passé.',
      '## Le thème de l’atelier',
      'Présentez le thème, la saison et les produits travaillés.',
      '## Le déroulé',
      '- L’accueil et la présentation des produits\n- La préparation, en petits groupes\n- La dégustation, tous ensemble',
      '## Ce qu’on en retient',
      'Les astuces anti-gaspi à refaire chez soi, en quelques lignes.',
      '## Les prochaines dates',
      'Les prochaines dates de l’atelier s’affichent automatiquement sous cet article.',
    ].join('\n\n'),
  },
  {
    slug: 'dans-les-coulisses-d-un-episode',
    titre: 'Dans les coulisses d’un épisode',
    extrait: 'Contenu de démonstration à remplacer : la trame d’un article qui prolonge un épisode du podcast.',
    categorie: 'coulisses-podcast',
    experiences: [],
    episode: true,
    joursAvant: 10,
    contenu: [
      AVERTISSEMENT,
      'Cet article montre comment prolonger un épisode du podcast : l’épisode lié s’écoute directement sous l’article.',
      '## Pourquoi ce sujet',
      'Racontez ce qui a donné envie de consacrer un épisode à ce sujet.',
      '## La préparation',
      'Les recherches, la rencontre, l’enregistrement : ce que l’auditeur ne voit pas.',
      '## Ce qui n’a pas trouvé sa place dans l’épisode',
      'Un détail, une anecdote ou une ressource à partager en plus.',
    ].join('\n\n'),
  },
  {
    slug: 'une-experience-culinaire-pour-votre-equipe',
    titre: 'Une expérience culinaire pour votre équipe',
    extrait: 'Contenu de démonstration à remplacer : la trame d’un article pour les entreprises, de l’atelier en équipe à l’immersion.',
    categorie: 'entreprises',
    experiences: ['atelier-cuisine-anti-gaspi', 'immersion-producteur'],
    episode: false,
    joursAvant: 17,
    contenu: [
      AVERTISSEMENT,
      'Cet article montre comment présenter les expériences aux entreprises : l’encadré « Demander un devis » s’affiche sous l’article.',
      '## Pour quelles occasions',
      'Séminaire, fin de projet, accueil de nouveaux collaborateurs : décrivez les occasions qui s’y prêtent.',
      '## Les formats possibles',
      '- Un atelier de cuisine en équipe\n- Un good tour à la rencontre de producteurs\n- Une immersion d’une journée',
      '## Comment se passe une demande',
      'Expliquez les étapes, de la demande de devis au jour de l’expérience.',
    ].join('\n\n'),
  },
];

/** Crée les articles de démonstration absents, publiés ; un article déjà présent n'est jamais modifié. */
export async function creerArticlesDemo(prisma: PrismaClient) {
  const episode = await prisma.episode.findFirst({ where: { type: 'complet' }, orderBy: { datePublication: 'desc' }, select: { id: true } });
  let crees = 0;
  for (const { experiences, episode: avecEpisode, joursAvant, ...article } of ARTICLES) {
    if (await prisma.article.count({ where: { slug: article.slug } })) continue;
    const liees = await prisma.experience.findMany({ where: { slug: { in: experiences } }, select: { id: true } });
    await prisma.article.create({
      data: {
        ...article, image: '', imageAlt: '', publie: true,
        datePublication: new Date(Date.now() - joursAvant * 86_400_000),
        episodeId: avecEpisode ? episode?.id ?? null : null,
        experiences: { connect: liees },
      },
    });
    crees++;
  }
  return { crees, sansEpisode: !episode };
}
