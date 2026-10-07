import CarteExperience, { type CarteExperienceDonnees } from '@/frontend/components/CarteExperience';
import OngletsExperiences from '@/frontend/components/OngletsExperiences';

/** Textes de la page des expériences, modifiables dans /admin/textes (page Expériences). */
export type TextesExperiences = Record<'titre' | 'introduction' | 'ongletParticuliers' | 'ongletEntreprises' | 'aucuneExperience', string>;

/** En-tête commun aux deux onglets : titre, présentation et onglets Particuliers / Entreprises. */
export function EnTeteExperiences({ textes, actif }: { textes: TextesExperiences; actif: 'particuliers' | 'entreprises' }) {
  return (
    <>
      <h1 className="text-3xl font-bold">{textes.titre}</h1>
      <p className="mt-3 max-w-2xl whitespace-pre-line text-texte-doux">{textes.introduction}</p>
      <OngletsExperiences actif={actif} libelles={{ particuliers: textes.ongletParticuliers, entreprises: textes.ongletEntreprises }} />
    </>
  );
}

/** /experiences, onglet Particuliers (maquette « Frame 18 ») : une carte par expérience. */
export default function Experiences({ textes, experiences }: { textes: TextesExperiences; experiences: CarteExperienceDonnees[] }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <EnTeteExperiences textes={textes} actif="particuliers" />
      {experiences.length === 0 ? (
        <p className="mt-10 whitespace-pre-line text-texte-doux">{textes.aucuneExperience}</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map(experience => <CarteExperience key={experience.id} experience={experience} />)}
        </div>
      )}
    </main>
  );
}
