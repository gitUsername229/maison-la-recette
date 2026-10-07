import { connection } from 'next/server';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { metadonnees } from '@/backend/seo';
import TexteLegal from '@/frontend/pages/texte-legal';

export const metadata = metadonnees({
  titre: 'Politique de confidentialité',
  description: 'Les données personnelles recueillies par Maison La recette (réservation, devis, newsletter), leur usage et vos droits.',
  chemin: '/confidentialite',
});

export default async function Page() {
  await connection(); // texte modifiable dans /admin/textes, lu à chaque requête
  return <TexteLegal {...await textesDePage('confidentialite')} />;
}
