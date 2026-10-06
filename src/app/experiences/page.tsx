import { listerExperiences } from '@/backend/ateliers/catalogue';
import Experiences from '@/frontend/pages/experiences';

export const dynamic = 'force-dynamic';
export { metadata } from '@/frontend/pages/experiences';

export default async function Page() {
  return <Experiences experiences={await listerExperiences()} />;
}
