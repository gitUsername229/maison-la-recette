import { chiffresTableauDeBord } from '@/backend/admin/tableau-de-bord';
import { exigerAdminPage } from '@/backend/auth/acces-page';
import TableauDeBord from '@/frontend/pages/admin';

export default async function Page() {
  const admin = await exigerAdminPage('/admin');
  return <TableauDeBord nom={admin.nom} chiffres={await chiffresTableauDeBord()} />;
}
