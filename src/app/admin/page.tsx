import { chiffresTableauDeBord } from '@/backend/admin/tableau-de-bord';
import { exigerConnexionPage } from '@/backend/auth/acces-page';
import TableauDeBord from '@/frontend/pages/admin';

export default async function Page() {
  const admin = await exigerConnexionPage('/admin', 'admin');
  return <TableauDeBord nom={admin.nom} chiffres={await chiffresTableauDeBord()} />;
}
