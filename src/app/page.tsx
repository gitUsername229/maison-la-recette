import { connection } from 'next/server';
import { cartesExperiences, photosDesExperiences } from '@/backend/ateliers/catalogue';
import { listerAvis, listerEpisodes } from '@/backend/contenus/contenus';
import { imagesDePage } from '@/backend/contenus/images';
import { textesDePage } from '@/backend/contenus/textes-pages';
import { LECTEUR_PODCAST, LIENS_EMISSION, PRESENTATION_EMISSION } from '@/backend/podcast/emission';
import { sansEmojis } from '@/backend/podcast/flux';
import Home from '@/frontend/pages/home';

export default async function Page() {
  await connection(); // textes, photos, expériences, avis et épisodes gérés dans l'admin, visibles aussitôt
  const [textes, photos, [extrait], experiences, avis, photosEntreprises] = await Promise.all([
    textesDePage('accueil'), imagesDePage('/'), listerEpisodes({ type: 'extrait', limite: 1 }),
    cartesExperiences(), listerAvis(), photosDesExperiences(),
  ]);
  return (
    <Home
      textes={textes} photos={photos} emission={PRESENTATION_EMISSION} lecteur={LECTEUR_PODCAST} liens={LIENS_EMISSION}
      extrait={extrait ? {
        id: extrait.id, titre: sansEmojis(extrait.titre), invite: extrait.invite, resume: '', datePublication: extrait.datePublication.toISOString(),
        dureeMin: extrait.dureeMin, image: extrait.image, embedUrl: extrait.embedUrl, audioUrl: extrait.audioUrl,
      } : null}
      experiences={experiences} avis={avis} photosEntreprises={photosEntreprises}
    />
  );
}
