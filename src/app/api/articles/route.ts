import { articles } from '@/backend/contenus/contenus';

export const runtime = 'nodejs';
export const GET = articles.lister;
export const POST = articles.creer;
