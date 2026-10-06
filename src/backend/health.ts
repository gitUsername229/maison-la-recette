import 'server-only';

export function getHealth() {
  return Response.json({ name: 'Maison La recette', status: 'ok' });
}
