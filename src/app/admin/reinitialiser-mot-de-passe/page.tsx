import type { Metadata } from 'next';
import ReinitialiserMotDePasse from '@/frontend/pages/reinitialiser-mot-de-passe';

export const metadata: Metadata = { title: 'Mot de passe | Administration' };

// Better Auth redirige ici depuis le lien de l'e-mail : ?token=… si le lien est valable, ?error=… sinon.
type Props = { searchParams: Promise<{ token?: string; error?: string }> };

export default async function Page({ searchParams }: Props) {
  const { token, error } = await searchParams;
  return <ReinitialiserMotDePasse token={error ? null : token ?? null} />;
}
