import { connection } from 'next/server';
import { cartesExperiences, photosDesExperiences } from '@/backend/ateliers/catalogue';
import { LECTEUR_PODCAST, LIENS_EMISSION, PRESENTATION_EMISSION } from '@/backend/podcast/emission';
import { episodesAusha, filtrerEpisodes, pourLecteur } from '@/backend/podcast/episodes';
import { AVIS } from '@/contenu/avis';
import { FOND_ACCUEIL } from '@/contenu/photos';
import { TEXTES } from '@/contenu/textes';
import Home from '@/frontend/pages/home';

export default async function Page() {
  await connection(); // dernier extrait du podcast (flux Ausha, en cache) et prochaines dates lus à chaque requête
  const [episodes, experiences, photosEntreprises] = await Promise.all([episodesAusha(), cartesExperiences(), photosDesExperiences()]);
  const [extrait] = filtrerEpisodes(episodes ?? [], { type: 'extrait' });
  return (
    <Home
      textes={TEXTES.accueil} fond={FOND_ACCUEIL} emission={PRESENTATION_EMISSION} lecteur={LECTEUR_PODCAST} liens={LIENS_EMISSION}
      extrait={extrait ? { ...pourLecteur(extrait), resume: '' } : null}
      experiences={experiences} avis={AVIS} photosEntreprises={photosEntreprises}
    />
  );
}
