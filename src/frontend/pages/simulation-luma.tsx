import Link from 'next/link';
import { formatDateHeure, formatPrix } from '@/frontend/format';
import { classeGrandBouton } from '@/frontend/styles/classes';

type Props = {
  evenement: {
    titre: string; debut: string; lieu: string | null; description: string;
    prix: { centimes: number; devise: string } | null; placesRestantes: number | null; inscriptionOuverte: boolean;
  };
};

/** Page factice « Simulation Luma » : ce que verrait le visiteur sur Luma, sans aucune inscription réelle. */
export default function SimulationLuma({ evenement }: Props) {
  const { titre, debut, lieu, description, prix, placesRestantes, inscriptionOuverte } = evenement;
  return (
    <main className="mx-auto max-w-xl px-5 py-8 lg:py-12">
      <p role="note" className="rounded-2xl bg-secondaire px-4 py-3 font-bold text-sur-secondaire">
        Simulation Luma : cette page imite la page d’inscription Luma de l’événement. Aucune inscription n’est enregistrée.
      </p>
      <h1 className="mt-6 font-titre text-4xl text-titre">{titre}</h1>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl bg-fond p-5 text-sm">
        <dt className="font-bold">Date</dt><dd>{formatDateHeure(debut)}</dd>
        {lieu && <><dt className="font-bold">Lieu</dt><dd>{lieu} (adresse envoyée après l’inscription)</dd></>}
        <dt className="font-bold">Prix</dt><dd>{prix ? formatPrix(prix.centimes, prix.devise) : 'Gratuit'}</dd>
        {placesRestantes !== null && <><dt className="font-bold">Places</dt><dd>{placesRestantes > 0 ? `${placesRestantes} restante${placesRestantes > 1 ? 's' : ''}` : 'Complet'}</dd></>}
      </dl>
      <p className="mt-5 leading-relaxed">{description}</p>
      <button type="button" disabled className={`mt-6 ${classeGrandBouton.primaire} cursor-not-allowed opacity-60`}>
        {inscriptionOuverte ? 'S’inscrire (simulation)' : 'Inscriptions fermées'}
      </button>
      <Link href="/experiences" className="mt-6 inline-block underline">Revenir aux expériences</Link>
    </main>
  );
}
