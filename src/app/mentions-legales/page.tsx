import { metadonnees } from '@/backend/seo';
import { TEXTES } from '@/contenu/textes';
import TexteLegal from '@/frontend/pages/texte-legal';

export const metadata = metadonnees({
  titre: 'Mentions légales',
  description: 'Éditeur, hébergement et propriété intellectuelle du site Maison La recette.',
  chemin: '/mentions-legales',
});

export default function Page() {
  return <TexteLegal {...TEXTES['mentions-legales']} lien={{ href: '/confidentialite', texte: 'Lire la politique de confidentialité' }} />;
}
