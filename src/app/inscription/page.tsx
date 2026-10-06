import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { utilisateurCourant } from '@/backend/auth/acces-page';
import Inscription from '@/frontend/pages/inscription';
import { cheminDeRetour } from '@/frontend/navigation';

export const metadata: Metadata = {
  title: 'Créer un compte | Maison La recette',
  description: 'Créez votre compte pour réserver une expérience ou demander un devis.',
};

type Props = { searchParams: Promise<{ retour?: string }> };

export default async function Page({ searchParams }: Props) {
  const retour = cheminDeRetour((await searchParams).retour);
  // Déjà connecté : inutile d'afficher le formulaire.
  if (await utilisateurCourant()) redirect(retour);
  return <Inscription retour={retour} />;
}
