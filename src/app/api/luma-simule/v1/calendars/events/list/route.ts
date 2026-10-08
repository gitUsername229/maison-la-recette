import { listeSimulee } from '@/backend/luma/simulation';

// Faux serveur Luma (LUMA_MODE=simulation) : même route que GET https://public-api.luma.com/v1/calendars/events/list.
export const GET = (request: Request) => listeSimulee(request);
