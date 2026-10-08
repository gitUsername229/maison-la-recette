import type { Metadata } from 'next';
import { Anton, Inria_Sans } from 'next/font/google';
import '@/frontend/styles/globals.css';
import { adresseDuSite, NOM_DU_SITE } from '@/backend/site';
import EnTete from '@/frontend/components/EnTete';
import PiedDePage from '@/frontend/components/PiedDePage';

// Polices de la maquette Figma, avec leurs polices de secours : Anton pour les titres, Inria Sans pour le texte
// et les boutons. Les variables CSS sont reprises dans src/frontend/styles/globals.css (font-titre et font-sans).
const policeTitres = Anton({
  subsets: ['latin'], weight: '400', display: 'swap',
  variable: '--police-titre', fallback: ['Impact', 'Arial Narrow', 'sans-serif'],
});
const policeTexte = Inria_Sans({
  subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap',
  variable: '--police-texte', fallback: ['Arial', 'Helvetica', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: adresseDuSite(), // adresses absolues des aperçus de partage et des pages canoniques
  title: NOM_DU_SITE,
  description: 'Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.',
  openGraph: { siteName: NOM_DU_SITE, locale: 'fr_FR', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${policeTitres.variable} ${policeTexte.variable}`}>
      <body className="flex min-h-screen flex-col">
        <EnTete />
        <div className="flex-1">{children}</div>
        <PiedDePage />
      </body>
    </html>
  );
}
