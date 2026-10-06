import type { Metadata } from 'next';
import { exigerConnexionPage } from '@/backend/auth/acces-page';
import { espaceCompte } from '@/backend/comptes/compte';
import Compte from '@/frontend/pages/compte';

export const metadata: Metadata = { title: 'Mon compte | Maison La recette' };

// Après le lien de vérification, Better Auth revient ici (avec ?error=… si le lien n'est plus valable).
type Props = { searchParams: Promise<{ error?: string }> };

export default async function Page({ searchParams }: Props) {
  const utilisateur = await exigerConnexionPage('/compte');
  const { reservations, demandesDevis } = await espaceCompte(utilisateur.id);
  const lienExpire = Boolean((await searchParams).error);
  return <Compte utilisateur={utilisateur} lienExpire={lienExpire} reservations={reservations} demandesDevis={demandesDevis} />;
}
