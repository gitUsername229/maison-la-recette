import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { evenementLuma, modeLuma } from '@/backend/luma/client';
import SimulationLuma from '@/frontend/pages/simulation-luma';

export const metadata: Metadata = { title: 'Simulation Luma · Maison La recette', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

/**
 * Page factice qui tient lieu de page d'inscription Luma en simulation (LUMA_MODE=simulation) : elle lit
 * l'événement par le faux serveur Luma, comme le ferait le site avec la vraie API. Elle n'existe pas en mode api.
 */
export default async function Page({ params }: Props) {
  await connection();
  if (modeLuma() !== 'simulation') notFound();
  const evenement = await evenementLuma((await params).id);
  if (!evenement) notFound();
  return <SimulationLuma evenement={{ ...evenement, debut: evenement.debut.toISOString() }} />;
}
