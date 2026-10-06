import 'server-only';
import { timingSafeEqual } from 'node:crypto';

/** Retourne une réponse 401 si la clé admin est absente ou incorrecte. */
export function requireAdmin(request: Request): Response | null {
  const expected = process.env.ADMIN_KEY;
  const actual = request.headers.get('x-admin-key');

  if (!expected || !actual) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (expectedBytes.length !== actualBytes.length || !timingSafeEqual(expectedBytes, actualBytes)) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  return null;
}
