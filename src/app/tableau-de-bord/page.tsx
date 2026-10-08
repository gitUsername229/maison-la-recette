import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { COOKIE_TABLEAU_DE_BORD, pageTableauDeBord } from '@/backend/tableau-de-bord/acces';
import ConnexionTableauDeBord from '@/frontend/components/ConnexionTableauDeBord';
import TableauDeBord from '@/frontend/pages/tableau-de-bord';

// Page cachée : aucun lien dans le menu ni le pied de page, absente du sitemap, interdite dans robots.txt.
export const metadata: Metadata = { title: 'Tableau de bord | Maison La recette', robots: { index: false, follow: false } };

/** Tableau de bord privé de la cliente : chiffres agrégés en lecture seule, derrière un mot de passe partagé. */
export default async function Page() {
  const page = await pageTableauDeBord((await cookies()).get(COOKIE_TABLEAU_DE_BORD)?.value);
  if (!page.autorise) return <ConnexionTableauDeBord configure={page.configure} />;
  return <TableauDeBord donnees={page.donnees} />;
}
