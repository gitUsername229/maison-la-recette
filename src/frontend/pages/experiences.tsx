import { CarteEvenement, CarteEvenementPasse, CarteSurDevis, type EvenementCarte, type ExperienceCarte } from '@/frontend/components/CarteExperience';
import ChoixParametre from '@/frontend/components/ChoixParametre';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import OngletsExperiences from '@/frontend/components/OngletsExperiences';
import { LienCalendrierLuma } from '@/frontend/components/ProchainesDates';

/** Textes de la page des expériences (src/contenu/textes.ts, page Expériences). */
export type TextesExperiences = Record<'titre' | 'ongletParticuliers' | 'ongletEntreprises', string>;
export type TextesParticuliers = TextesExperiences & Record<'aVenirTitre' | 'aucuneDate' | 'surDevisTitre' | 'avisTitre' | 'passeesTitre', string>;

/** En-tête commun aux deux onglets : titre et onglets Particuliers / Entreprises. */
export function EnTeteExperiences({ textes, actif }: { textes: TextesExperiences; actif: 'particuliers' | 'entreprises' }) {
  return (
    <>
      <h1 className="font-titre text-4xl text-titre">{textes.titre}</h1>
      <OngletsExperiences actif={actif} libelles={{ particuliers: textes.ongletParticuliers, entreprises: textes.ongletEntreprises }} />
    </>
  );
}

type Props = {
  textes: TextesParticuliers;
  evenements: EvenementCarte[] | null;        // prochains événements Luma ; null : Luma illisible
  surDevis: ExperienceCarte[];                // expériences sur devis (immersions)
  avis: AvisAffiche[];
  passees: EvenementCarte[];                  // événements passés de l'année choisie
  annees: number[];                           // années qui ont des événements passés, la plus récente d'abord
  annee: number | null;
};

const grille = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

/**
 * /experiences, onglet Particuliers (maquette) : les prochains événements Luma (« Réserver sur Luma »), les
 * expériences sur devis, les avis avec la note moyenne, puis les événements passés de l'année choisie (?annee=2026).
 */
export default function Experiences({ textes, evenements, surDevis, avis, passees, annees, annee }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <EnTeteExperiences textes={textes} actif="particuliers" />

      <section aria-labelledby="a-venir" className="mt-8">
        <h2 id="a-venir" className="text-xl font-bold text-titre">{textes.aVenirTitre}</h2>
        {evenements && evenements.length > 0 ? (
          <ul className={`mt-4 ${grille}`}>
            {evenements.map(evenement => <li key={evenement.id}><CarteEvenement evenement={evenement} /></li>)}
          </ul>
        ) : (
          <p className="mt-4 grid gap-2 rounded-2xl bg-fond p-5">
            <span>{evenements === null ? 'Les dates sont publiées sur notre calendrier Luma.' : textes.aucuneDate}</span>
            <LienCalendrierLuma />
          </p>
        )}
      </section>

      {surDevis.length > 0 && (
        <section aria-labelledby="sur-devis" className="mt-12">
          <h2 id="sur-devis" className="text-xl font-bold text-titre">{textes.surDevisTitre}</h2>
          <ul className={`mt-4 ${grille}`}>
            {surDevis.map(experience => <li key={experience.slug}><CarteSurDevis experience={experience} /></li>)}
          </ul>
        </section>
      )}

      {avis.length > 0 && <div className="mt-12"><ListeAvis avis={avis} titre={textes.avisTitre} /></div>}

      {annee !== null && (
        <section aria-labelledby="passees" className="mt-12">
          <h2 id="passees" className="text-xl font-bold text-titre">{textes.passeesTitre}</h2>
          <div className="mt-4">
            <ChoixParametre parametre="annee" etiquette="Année" valeur={annee} options={annees.map(a => ({ valeur: a, texte: String(a) }))} />
          </div>
          <ul className={`mt-4 ${grille}`}>
            {passees.map(evenement => <li key={evenement.id}><CarteEvenementPasse evenement={evenement} /></li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
