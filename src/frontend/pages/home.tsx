import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import InscriptionNewsletter from '@/frontend/components/InscriptionNewsletter';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';

const univers = [
  { titre: 'Podcast', description: 'Des voix et des histoires autour de ce qui nous nourrit.' },
  { titre: 'Expériences', description: 'Ateliers, good tours et immersions pour se retrouver.', href: '/experiences' },
  { titre: 'Studio', description: 'Des podcasts à imaginer et à produire pour les marques.' },
];

/** Avis et photos de l'accueil : gérés dans /admin/avis et /admin/photos (page « / »). */
export default function Home({ avis, photos }: { avis: AvisAffiche[]; photos: PhotoGalerie[] }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
      <p className="mb-6 text-sm uppercase tracking-widest">Podcast · Expériences · Studio</p>
      <h1 className="font-serif text-5xl sm:text-7xl">Maison La recette</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed">Un lieu de rencontres, d’histoires et d’expériences autour de l’alimentation.</p>
      <Link href="/experiences" className="mt-10 inline-flex w-fit rounded-full bg-encre px-6 py-3.5 font-medium text-creme transition hover:bg-black">
        Réserver une expérience
      </Link>
      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {univers.map(({ titre, description, href }) => (
          <section key={titre} className="border-t border-stone-300 pt-5">
            <h2 className="font-serif text-2xl">{href ? <Link href={href} className="hover:underline">{titre} →</Link> : titre}</h2>
            <p className="mt-3 leading-relaxed text-stone-600">{description}</p>
          </section>
        ))}
      </div>
      <ListeAvis avis={avis} />
      <Galerie photos={photos} />
      <InscriptionNewsletter />
      <p className="mt-16 text-sm text-stone-500">Le site est en préparation.</p>
    </main>
  );
}
