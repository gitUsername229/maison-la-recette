import type { Metadata } from 'next';
import { exigerConnexionPage } from '@/backend/auth/acces-page';
import { espaceCompte } from '@/backend/comptes/compte';
import Compte from '@/frontend/pages/compte';

export const metadata: Metadata = { title: 'Mon compte | Maison La recette' };

export default async function Page() {
  const utilisateur = await exigerConnexionPage('/compte');
  const { reservations, demandesDevis } = await espaceCompte(utilisateur.id);
  return <Compte utilisateur={utilisateur} reservations={reservations} demandesDevis={demandesDevis} />;
}
