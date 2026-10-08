import CarteExperience, { CarteSessionPassee, type CarteExperienceDonnees, type SessionPassee } from '@/frontend/components/CarteExperience';
import ChoixParametre from '@/frontend/components/ChoixParametre';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import OngletsExperiences from '@/frontend/components/OngletsExperiences';

/** Textes de la page des expériences (src/contenu/textes.ts, page Expériences). */
export type TextesExperiences = Record<'titre' | 'ongletParticuliers' | 'ongletEntreprises', string>;
export type TextesParticuliers = TextesExperiences & Record<'aVenirTitre' | 'aucuneExperience' | 'avisTitre' | 'passeesTitre', string>;

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
  experiences: CarteExperienceDonnees[];
  avis: AvisAffiche[];
  passees: SessionPassee[];                   // celles de l'année choisie
  annees: number[];                           // années qui ont des sessions passées, la plus récente d'abord
  annee: number | null;
};

const grille = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

/**
 * /experiences, onglet Particuliers (maquette) : les expériences à venir (Réserver), les avis avec la note moyenne,
 * puis les expériences passées de l'année choisie (?annee=2026).
 */
export default function Experiences({ textes, experiences, avis, passees, annees, annee }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <EnTeteExperiences textes={textes} actif="particuliers" />

      <section aria-labelledby="a-venir" className="mt-8">
        <h2 id="a-venir" className="text-xl font-bold text-titre">{textes.aVenirTitre}</h2>
        {experiences.length === 0 ? (
          <p className="mt-4 whitespace-pre-line text-texte-doux">{textes.aucuneExperience}</p>
        ) : (
          <ul className={`mt-4 ${grille}`}>
            {experiences.map(experience => <li key={experience.id}><CarteExperience experience={experience} action="reserver" /></li>)}
          </ul>
        )}
      </section>

      {avis.length > 0 && <div className="mt-12"><ListeAvis avis={avis} titre={textes.avisTitre} /></div>}

      {annee !== null && (
        <section aria-labelledby="passees" className="mt-12">
          <h2 id="passees" className="text-xl font-bold text-titre">{textes.passeesTitre}</h2>
          <div className="mt-4">
            <ChoixParametre parametre="annee" etiquette="Année" valeur={annee} options={annees.map(a => ({ valeur: a, texte: String(a) }))} />
          </div>
          <ul className={`mt-4 ${grille}`}>
            {passees.map(session => <li key={session.id}><CarteSessionPassee session={session} /></li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
