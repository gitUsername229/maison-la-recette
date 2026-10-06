import { episodes } from '@/backend/contenus/contenus';

export const runtime = 'nodejs';
export const GET = episodes.lister;
export const POST = episodes.creer;
