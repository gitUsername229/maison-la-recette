import Link from 'next/link';
import Feuille from '@/frontend/components/Feuille';

type LienEcoute = { plateforme: string; url: string };

const EXPLORER = [
  { href: '/experiences', label: 'Ateliers, good tours et immersions' },
  { href: '/podcast', label: 'Le podcast' },
  { href: '/blog', label: 'Le blog' },
  { href: '/studio', label: 'Studio de production' },
  { href: '/a-propos', label: 'À propos' },
];

const classeLien = 'text-lien-sur-sombre underline-offset-4 hover:underline';

/** Pied de page : navigation, contact et liens d'écoute du podcast (src/backend/podcast/emission.ts). */
export default function PiedDePage({ liensEcoute }: { liensEcoute: readonly LienEcoute[] }) {
  return (
    <footer className="zone-sombre mt-20 bg-fond-sombre text-sur-fond-sombre">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-3">
          <p className="flex items-center gap-2 whitespace-nowrap text-2xl lowercase">
            <Feuille className="h-7 w-7 text-lien-sur-sombre" />
            Maison La recette
          </p>
          <p className="text-sm leading-relaxed">Podcast, expériences et studio : une autre façon de se retrouver autour de l’alimentation.</p>
        </div>

        <nav aria-label="Explorer le site" className="grid content-start gap-2 text-sm">
          <p className="text-lg font-bold">Explorer</p>
          {EXPLORER.map(lien => <Link key={lien.href} href={lien.href} className={classeLien}>{lien.label}</Link>)}
        </nav>

        <div className="grid content-start gap-2 text-sm">
          <p className="text-lg font-bold">Écouter le podcast</p>
          {liensEcoute.map(lien => (
            <a key={lien.url} href={lien.url} target="_blank" rel="noopener noreferrer" className={classeLien}>{lien.plateforme}</a>
          ))}
        </div>

        <div className="grid content-start gap-3 text-sm">
          <p className="text-lg font-bold">Un projet ?</p>
          <p className="leading-relaxed">Atelier d’équipe, immersion, podcast de marque : parlons-en.</p>
          <Link href="/contact" className="w-fit rounded-full bg-primaire px-5 py-2.5 font-bold text-sur-primaire hover:bg-primaire-fort">
            Nous contacter
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 border-t border-sur-fond-sombre/20 px-6 py-5 text-xs">
        <p>© {new Date().getFullYear()} Maison La recette · Photos de démonstration : Unsplash</p>
        <nav aria-label="Informations légales" className="flex gap-4">
          <Link href="/mentions-legales" className={classeLien}>Mentions légales</Link>
          <Link href="/confidentialite" className={classeLien}>Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
