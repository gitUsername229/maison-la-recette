import type { Metadata } from 'next';
import '@/frontend/styles/globals.css';
import EnTete from '@/frontend/components/EnTete';

export const metadata: Metadata = {
  title: 'Maison La recette',
  description: 'Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><EnTete />{children}</body></html>;
}
