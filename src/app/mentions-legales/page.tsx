import { connection } from 'next/server';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { metadonnees } from '@/backend/seo';
import TexteLegal from '@/frontend/pages/texte-legal';

export const metadata = metadonnees({
  titre: 'Mentions légales',
  description: 'Éditeur, hébergement et propriété intellectuelle du site Maison La recette.',
  chemin: '/mentions-legales',
});

export default async function Page() {
  await connection(); // texte modifiable dans /admin/textes, lu à chaque requête
  return <TexteLegal {...await textesDePage('mentions-legales')} lien={{ href: '/confidentialite', texte: 'Lire la politique de confidentialité' }} />;
}
