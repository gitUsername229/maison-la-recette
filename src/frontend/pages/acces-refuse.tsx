import Link from 'next/link';

export default function AccesRefuse() {
  return (
    <main className="mx-auto max-w-md px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="text-3xl font-bold lg:text-4xl">Accès refusé</h1>
      <p className="mt-4 leading-relaxed text-texte-doux">Cette page est réservée à l’administration du site.</p>
      <div className="mt-8 flex gap-6 text-sm">
        <Link href="/" className="underline">Accueil</Link>
        <Link href="/compte" className="underline">Mon compte</Link>
      </div>
    </main>
  );
}
