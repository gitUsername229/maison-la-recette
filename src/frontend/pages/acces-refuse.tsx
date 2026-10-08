import Link from 'next/link';

export default function AccesRefuse() {
  return (
    <main className="mx-auto max-w-md px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="font-titre text-4xl text-titre">Accès refusé</h1>
      <p className="mt-4 leading-relaxed">Cette page est réservée à l’administration du site.</p>
      <Link href="/" className="mt-8 inline-block text-sm underline">Retour au site</Link>
    </main>
  );
}
