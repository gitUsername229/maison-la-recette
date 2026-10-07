import { articles } from '@/backend/contenus/articles';

export const runtime = 'nodejs';
export const GET = articles.lister;
export const POST = articles.creer;
