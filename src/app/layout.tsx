import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import '@/frontend/styles/globals.css';
import { LIENS_EMISSION } from '@/backend/podcast/emission';
import { adresseDuSite, NOM_DU_SITE } from '@/backend/site';
import EnTete from '@/frontend/components/EnTete';
import PiedDePage from '@/frontend/components/PiedDePage';

// Polices du thème (provisoire) : serif pour les titres, en écho au logo du podcast ; sans-serif pour le texte.
// Les variables CSS sont reprises dans src/frontend/styles/globals.css (font-serif, font-sans).
const titres = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--police-titres', fallback: ['Georgia', 'Times New Roman', 'serif'] });
const texte = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--police-texte', fallback: ['system-ui', 'Arial', 'sans-serif'] });

export const metadata: Metadata = {
  metadataBase: adresseDuSite(), // adresses absolues des aperçus de partage et des pages canoniques
  title: NOM_DU_SITE,
  description: 'Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.',
  openGraph: { siteName: NOM_DU_SITE, locale: 'fr_FR', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${titres.variable} ${texte.variable}`}>
      <body className="flex min-h-screen flex-col">
        <EnTete />
        <div className="flex-1">{children}</div>
        <PiedDePage liensEcoute={LIENS_EMISSION} />
      </body>
    </html>
  );
}
