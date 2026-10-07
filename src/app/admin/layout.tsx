import type { Metadata } from 'next';

// Tout /admin (connexion comprise) : jamais indexé, absent du sitemap et interdit dans robots.txt.
// Cacher l'adresse ne protège rien : chaque page et chaque route vérifie connexion et rôle admin (verifierAcces).
export const metadata: Metadata = { title: 'Administration | Maison La recette', robots: { index: false, follow: false } };

export default function LayoutAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
