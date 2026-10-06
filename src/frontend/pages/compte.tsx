import Link from 'next/link';
import Pastille from '@/frontend/components/Pastille';
import { formatDate, formatDateHeure, formatPrix, libelle, STATUTS_DEVIS, STATUTS_RESERVATION, TYPES_DEVIS } from '@/frontend/format';

export type ReservationCompte = {
  id: number;
  nbPersonnes: number;
  montantCents: number;
  statut: string;
  session: { dateDebut: Date; lieu: string; experience: { titre: string; slug: string } };
};

export type DevisCompte = {
  id: number;
  typeDemande: string;
  entreprise: string;
  nbParticipants: number | null;
  dateSouhaitee: Date | null;
  statut: string;
  createdAt: Date;
  experience: { titre: string } | null;
};

type Props = {
  utilisateur: { nom: string; email: string; telephone: string | null };
  reservations: ReservationCompte[];
  demandesDevis: DevisCompte[];
};

const classeCarte = 'rounded-xl bg-white p-4 ring-1 ring-stone-200';

export default function Compte({ utilisateur, reservations, demandesDevis }: Props) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="font-serif text-4xl sm:text-5xl">Mon compte</h1>
      <p className="mt-3 text-stone-600">{utilisateur.nom} · {utilisateur.email}{utilisateur.telephone && ` · ${utilisateur.telephone}`}</p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Mes réservations</h2>
        {reservations.length === 0 ? (
          <p className="mt-4 text-stone-600">Aucune réservation pour l’instant. <Link href="/experiences" className="underline">Découvrir les expériences</Link></p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {reservations.map(r => (
              <li key={r.id} className={classeCarte}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/experiences/${r.session.experience.slug}`} className="font-medium hover:underline">{r.session.experience.titre}</Link>
                  <Pastille statut={r.statut} texte={libelle(STATUTS_RESERVATION, r.statut)} />
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {formatDateHeure(r.session.dateDebut)} · {r.session.lieu} · {r.nbPersonnes} personne{r.nbPersonnes > 1 ? 's' : ''} · {formatPrix(r.montantCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl">Mes demandes de devis</h2>
          <Link href="/contact" className="text-sm underline">Nouvelle demande</Link>
        </div>
        {demandesDevis.length === 0 ? (
          <p className="mt-4 text-stone-600">Aucune demande de devis pour l’instant.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {demandesDevis.map(d => (
              <li key={d.id} className={classeCarte}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{libelle(TYPES_DEVIS, d.typeDemande)}{d.experience && ` : ${d.experience.titre}`}</p>
                  <Pastille statut={d.statut} texte={libelle(STATUTS_DEVIS, d.statut)} />
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {d.entreprise} · envoyée le {formatDate(d.createdAt)}
                  {d.nbParticipants && ` · ${d.nbParticipants} participants`}
                  {d.dateSouhaitee && ` · souhaitée le ${formatDate(d.dateSouhaitee)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
