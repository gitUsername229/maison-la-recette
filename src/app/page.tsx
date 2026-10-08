import { connection } from 'next/server';
import { cartesExperiences, photosDesExperiences } from '@/backend/ateliers/catalogue';
import { listerEpisodes } from '@/backend/contenus/contenus';
import { LECTEUR_PODCAST, LIENS_EMISSION, PRESENTATION_EMISSION } from '@/backend/podcast/emission';
import { sansEmojis } from '@/backend/podcast/flux';
import { AVIS } from '@/contenu/avis';
import { FOND_ACCUEIL } from '@/contenu/photos';
import { TEXTES } from '@/contenu/textes';
import Home from '@/frontend/pages/home';

export default async function Page() {
  await connection(); // dernier extrait du podcast et prochaines dates lus à chaque requête
  const [[extrait], experiences, photosEntreprises] = await Promise.all([
    listerEpisodes({ type: 'extrait', limite: 1 }), cartesExperiences(), photosDesExperiences(),
  ]);
  return (
    <Home
      textes={TEXTES.accueil} fond={FOND_ACCUEIL} emission={PRESENTATION_EMISSION} lecteur={LECTEUR_PODCAST} liens={LIENS_EMISSION}
      extrait={extrait ? {
        id: extrait.id, titre: sansEmojis(extrait.titre), invite: extrait.invite, resume: '', datePublication: extrait.datePublication.toISOString(),
        dureeMin: extrait.dureeMin, image: extrait.image, embedUrl: extrait.embedUrl, audioUrl: extrait.audioUrl,
      } : null}
      experiences={experiences} avis={AVIS} photosEntreprises={photosEntreprises}
    />
  );
}
