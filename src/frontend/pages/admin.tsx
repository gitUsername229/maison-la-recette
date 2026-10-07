import Link from 'next/link';
import { RESSOURCES_ADMIN } from '@/frontend/admin/ressources';

type Props = {
  nom: string;
  chiffres: { devisNouveaux: number; reservationsAVenir: number; paiementsEnAttente: number; sessionsOuvertes: number };
};

export default function TableauDeBord({ nom, chiffres }: Props) {
  const cartes = [
    { valeur: chiffres.devisNouveaux, texte: 'nouvelles demandes de devis', href: '/admin/devis' },
    { valeur: chiffres.reservationsAVenir, texte: 'réservations payées à venir', href: '/admin/reservations' },
    { valeur: chiffres.paiementsEnAttente, texte: 'paiements en attente', href: '/admin/reservations' },
    { valeur: chiffres.sessionsOuvertes, texte: 'sessions ouvertes à venir', href: '/admin/sessions' },
  ];

  return (
    <section>
      <h1 className="font-serif text-4xl">Administration</h1>
      <p className="mt-2 text-texte-doux">Connecté en tant que {nom}. Tout le contenu du site se gère ici, sans toucher au code.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cartes.map(c => (
          <Link key={c.texte} href={c.href} className="rounded-2xl bg-surface p-4 ring-1 ring-bordure hover:ring-bordure-forte">
            <p className="font-serif text-3xl">{c.valeur}</p>
            <p className="mt-1 text-sm text-texte-doux">{c.texte}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESSOURCES_ADMIN.map(r => (
          <Link key={r.cle} href={`/admin/${r.cle}`} className="group border-t border-bordure-forte pt-4">
            <h2 className="font-serif text-xl group-hover:underline">{r.titre}</h2>
            <p className="mt-2 text-sm leading-relaxed text-texte-doux">{r.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
