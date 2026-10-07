import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { utilisateurCourant } from '@/backend/auth/acces-page';
import Connexion from '@/frontend/pages/connexion';
import { cheminDeRetour } from '@/frontend/navigation';

export const metadata: Metadata = { title: 'Connexion | Maison La recette', robots: { index: false } };

type Props = { searchParams: Promise<{ retour?: string }> };

export default async function Page({ searchParams }: Props) {
  const retour = cheminDeRetour((await searchParams).retour);
  // Déjà connecté : inutile d'afficher le formulaire.
  if (await utilisateurCourant()) redirect(retour);
  return <Connexion retour={retour} />;
}
