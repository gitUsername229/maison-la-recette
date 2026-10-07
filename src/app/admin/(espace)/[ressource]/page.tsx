import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { exigerAdminPage } from '@/backend/auth/acces-page';
import { ressourceAdmin } from '@/frontend/admin/ressources';
import TableauRessource from '@/frontend/admin/TableauRessource';

type Props = { params: Promise<{ ressource: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ressource = ressourceAdmin((await params).ressource);
  return { title: `${ressource?.titre ?? 'Administration'} | Administration` };
}

/** Une seule page pour les 10 rubriques de l'admin (voir src/frontend/admin/ressources.ts). */
export default async function Page({ params }: Props) {
  const { ressource } = await params;
  await exigerAdminPage(`/admin/${ressource}`);
  if (!ressourceAdmin(ressource)) notFound();
  return <TableauRessource cle={ressource} />;
}
