import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminConnecte } from '@/backend/auth/acces-page';
import Connexion from '@/frontend/pages/connexion';
import { cheminDeRetour } from '@/frontend/navigation';

// noindex : hérité du layout de /admin.
export const metadata: Metadata = { title: 'Connexion | Administration' };

type Props = { searchParams: Promise<{ retour?: string }> };

export default async function Page({ searchParams }: Props) {
  const retour = cheminDeRetour((await searchParams).retour);
  // Déjà connecté : inutile d'afficher le formulaire.
  if (await adminConnecte()) redirect(retour);
  return <Connexion retour={retour} />;
}
