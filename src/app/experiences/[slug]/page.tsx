import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { experiencePublique } from '@/backend/ateliers/catalogue';
import { utilisateurCourant } from '@/backend/auth/acces-page';
import Experience from '@/frontend/pages/experience';

type Props = { params: Promise<{ slug: string }> };

// Une seule requête par affichage, partagée par generateMetadata et la page.
const charger = cache((slug: string) => experiencePublique(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experience = await charger((await params).slug);
  return experience ? { title: `${experience.titre} | Maison La recette`, description: experience.accroche } : {};
}

export default async function Page({ params }: Props) {
  await connection(); // places restantes lues à chaque requête
  const experience = await charger((await params).slug);
  if (!experience) notFound();

  // Le formulaire est un composant client : dates en ISO, prix de la session ou de l'expérience.
  const sessions = experience.sessions
    .filter(session => session.statut === 'ouverte')
    .map(session => ({
      id: session.id,
      dateDebut: session.dateDebut.toISOString(),
      lieu: session.lieu,
      placesRestantes: session.placesRestantes,
      prixCents: session.prixCents ?? experience.prixCents,
    }));

  const utilisateur = await utilisateurCourant();
  const compte = utilisateur && { nom: utilisateur.nom, email: utilisateur.email };
  return <Experience experience={{ ...experience, sessions }} utilisateur={compte} />;
}
