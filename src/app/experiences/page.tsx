import { connection } from 'next/server';
import { listerExperiences } from '@/backend/ateliers/catalogue';
import Experiences from '@/frontend/pages/experiences';

export { metadata } from '@/frontend/pages/experiences';

export default async function Page() {
  await connection(); // lue en base à chaque requête, jamais figée au build
  return <Experiences experiences={await listerExperiences()} />;
}
