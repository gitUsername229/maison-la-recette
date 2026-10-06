import { partenaires } from '@/backend/contenus/contenus';

export const runtime = 'nodejs';
export const GET = partenaires.lister;
export const POST = partenaires.creer;
