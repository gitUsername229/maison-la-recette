import { metadonnees } from '@/backend/seo';
import { TEXTES } from '@/contenu/textes';
import TexteLegal from '@/frontend/pages/texte-legal';

export const metadata = metadonnees({
  titre: 'Politique de confidentialité',
  description: 'Les données personnelles recueillies par Maison La recette (devis, newsletter), leur usage et vos droits.',
  chemin: '/confidentialite',
});

export default function Page() {
  return <TexteLegal {...TEXTES['confidentialite']} />;
}
