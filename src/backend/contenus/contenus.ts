import 'server-only';
import { estAdmin } from '@/backend/auth/acces';
import { prisma } from '@/backend/db/prisma';
import { ApiError, endpoint, json, type RouteContext } from '@/backend/http';
import { entierParametre, routesRessource } from './crud';
import { articleSchemas, avisSchemas, episodeSchemas, partenaireSchemas } from './validation';

export const articles = routesRessource({
  schemas: articleSchemas,
  // ?limit=3 pour l'accueil
  lister: (admin, params) => prisma.article.findMany({ where: admin ? {} : { publie: true }, orderBy: { datePublication: 'desc' }, take: entierParametre(params, 'limit', 50) }),
  creer: data => prisma.article.create({ data }),
  modifier: (id, data) => prisma.article.update({ where: { id }, data }),
  supprimer: id => prisma.article.delete({ where: { id } }),
});

/** GET /api/articles/[slug] : un article publié (ou un brouillon pour l'admin). */
export const articleParSlug = endpoint(async (request: Request, context: RouteContext) => {
  const article = await prisma.article.findUnique({ where: { slug: (await context.params).id } });
  if (!article || (!article.publie && !await estAdmin(request))) throw new ApiError(404, 'Article introuvable');
  return json(article);
});

export const avis = routesRessource({
  schemas: avisSchemas,
  lister: admin => prisma.avis.findMany({ where: admin ? {} : { visible: true }, orderBy: { id: 'desc' } }),
  creer: data => prisma.avis.create({ data }),
  modifier: (id, data) => prisma.avis.update({ where: { id }, data }),
  supprimer: id => prisma.avis.delete({ where: { id } }),
});

export const partenaires = routesRessource({
  schemas: partenaireSchemas,
  lister: admin => prisma.partenaire.findMany({ where: admin ? {} : { visible: true }, orderBy: { nom: 'asc' } }),
  creer: data => prisma.partenaire.create({ data }),
  modifier: (id, data) => prisma.partenaire.update({ where: { id }, data }),
  supprimer: id => prisma.partenaire.delete({ where: { id } }),
});

/** Épisodes : tous publics. Filtres ?saison=2 et ?limit=3. */
export const episodes = routesRessource({
  schemas: episodeSchemas,
  lister: (_admin, params) => prisma.episode.findMany({
    where: { saison: entierParametre(params, 'saison', 100) },
    orderBy: [{ saison: 'desc' }, { numero: 'desc' }],
    take: entierParametre(params, 'limit', 50),
  }),
  creer: data => prisma.episode.create({ data }),
  modifier: (id, data) => prisma.episode.update({ where: { id }, data }),
  supprimer: id => prisma.episode.delete({ where: { id } }),
});
