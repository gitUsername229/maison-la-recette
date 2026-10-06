import { connection } from 'next/server';
import { listerAvis } from '@/backend/contenus/contenus';
import { imagesDePage } from '@/backend/contenus/images';
import Home from '@/frontend/pages/home';

export default async function Page() {
  await connection(); // avis et photos gérés dans l'admin, visibles aussitôt
  const [avis, photos] = await Promise.all([listerAvis({ limite: 4 }), imagesDePage('/')]);
  return <Home avis={avis} photos={photos} />;
}
