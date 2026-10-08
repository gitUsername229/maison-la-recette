import Link from 'next/link';
import Feuille from '@/frontend/components/Feuille';
import { classeGrandBouton } from '@/frontend/styles/classes';

/** Page 404 : adresse inconnue, article ou expérience introuvable. */
export default function Introuvable() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <Feuille className="mx-auto h-12 w-12 text-accent" />
      <h1 className="mt-6 font-titre text-4xl text-titre">Page introuvable</h1>
      <p className="mt-4 leading-relaxed">Cette page n’existe pas, ou plus. Elle a peut-être changé d’adresse.</p>
      <div className="mx-auto mt-8 grid max-w-[334px] gap-4 sm:flex sm:max-w-none sm:justify-center">
        <Link href="/" className={`${classeGrandBouton.primaire} sm:w-auto sm:px-8`}>Retour à l’accueil</Link>
        <Link href="/experiences" className={`${classeGrandBouton.contour} sm:w-auto sm:px-8`}>Voir les expériences</Link>
      </div>
    </main>
  );
}
