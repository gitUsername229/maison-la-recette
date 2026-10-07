import Link from 'next/link';
import Feuille from '@/frontend/components/Feuille';
import { classeBouton } from '@/frontend/styles/classes';

/** Page 404 : adresse inconnue, article ou expérience introuvable. */
export default function Introuvable() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <Feuille className="mx-auto h-12 w-12 text-accent" />
      <h1 className="mt-6 text-3xl font-bold lg:text-4xl">Page introuvable</h1>
      <p className="mt-4 leading-relaxed text-texte-doux">Cette page n’existe pas, ou plus. Elle a peut-être changé d’adresse.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className={classeBouton}>Retour à l’accueil</Link>
        <Link href="/experiences" className="rounded-full px-5 py-3 font-medium text-accent ring-2 ring-primaire hover:bg-pastel">Voir les expériences</Link>
      </div>
    </main>
  );
}
