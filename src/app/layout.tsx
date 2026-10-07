import type { Metadata } from 'next';
import { Inria_Serif } from 'next/font/google';
import '@/frontend/styles/globals.css';
import { LIENS_EMISSION } from '@/backend/podcast/emission';
import { adresseDuSite, NOM_DU_SITE } from '@/backend/site';
import EnTete from '@/frontend/components/EnTete';
import PiedDePage from '@/frontend/components/PiedDePage';

// Police de la maquette Figma (Inria Serif) pour tout le site, avec ses polices de secours.
// La variable CSS est reprise dans src/frontend/styles/globals.css (font-serif et font-sans).
const police = Inria_Serif({
  subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap',
  variable: '--police-site', fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  metadataBase: adresseDuSite(), // adresses absolues des aperçus de partage et des pages canoniques
  title: NOM_DU_SITE,
  description: 'Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.',
  openGraph: { siteName: NOM_DU_SITE, locale: 'fr_FR', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={police.variable}>
      <body className="flex min-h-screen flex-col">
        <EnTete />
        <div className="flex-1">{children}</div>
        <PiedDePage liensEcoute={LIENS_EMISSION} />
      </body>
    </html>
  );
}
