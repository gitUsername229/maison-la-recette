import { articleParSlug, articles } from '@/backend/contenus/contenus';

export const runtime = 'nodejs';
// GET par slug (public), PUT et DELETE par id (admin).
export const GET = articleParSlug;
export const PUT = articles.modifier;
export const DELETE = articles.supprimer;
