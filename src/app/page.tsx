import { connection } from 'next/server';
import { listerAvis } from '@/backend/contenus/contenus';
import { imagesDePage } from '@/backend/contenus/images';
import { textesDePage } from '@/backend/contenus/textes-pages';
import Home from '@/frontend/pages/home';

export default async function Page() {
  await connection(); // textes, avis et photos gérés dans l'admin, visibles aussitôt
  const [textes, avis, photos] = await Promise.all([textesDePage('accueil'), listerAvis({ limite: 4 }), imagesDePage('/')]);
  return <Home textes={textes} avis={avis} photos={photos} />;
}
