import type { Metadata } from 'next';
import '@/frontend/styles/globals.css';
import { adresseDuSite, NOM_DU_SITE } from '@/backend/site';
import EnTete from '@/frontend/components/EnTete';

export const metadata: Metadata = {
  metadataBase: adresseDuSite(), // adresses absolues des aperçus de partage et des pages canoniques
  title: NOM_DU_SITE,
  description: 'Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.',
  openGraph: { siteName: NOM_DU_SITE, locale: 'fr_FR', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><EnTete />{children}</body></html>;
}
