'use client';

import Link from 'next/link';
import { useState } from 'react';
import { appelerApi } from '@/frontend/admin/api';
import Champ, { CaseConsentement, ChampListe, ChampPiege, ChampTexte } from '@/frontend/components/Champ';
import { LIEUX_DEVIS, TYPES_DEVIS } from '@/frontend/format';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';

type Props = {
  experiences: { id: number; titre: string }[];
  experienceId?: number;
};

type Donnees = Record<string, string | number | boolean>;

// Noms des champs dans les messages d'erreur renvoyés par /api/devis.
const LIBELLES = {
  nom: 'Nom et prénom', entreprise: 'Entreprise ou organisation', email: 'E-mail', telephone: 'Téléphone', typeDemande: 'Votre demande',
  experienceId: 'Expérience', nbParticipants: 'Nombre de participants', dateSouhaitee: 'Date souhaitée', lieuSouhaite: 'Lieu souhaité', message: 'Votre projet',
  consentement: 'Politique de confidentialité',
};

/** Champs du formulaire → corps de POST /api/devis (champs vides retirés, nombres convertis, case cochée → true). */
function corpsDevis(formulaire: FormData): Donnees {
  const corps: Donnees = { consentement: formulaire.get('consentement') === 'on' };
  for (const [cle, valeur] of formulaire.entries()) {
    const texte = String(valeur).trim();
    if (!texte || cle === 'consentement') continue;
    corps[cle] = cle === 'experienceId' || cle === 'nbParticipants' ? Number(texte) : texte;
  }
  return corps;
}

/** Demande de devis, sans compte : coordonnées et projet saisis ici. */
export default function Contact({ experiences, experienceId }: Props) {
  const [typeDemande, setTypeDemande] = useState(experienceId ? 'experience' : '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreursChamps, setErreursChamps] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [merci, setMerci] = useState<string | null>(null);

  async function envoyer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setErreursChamps({});
    setEnvoi(true);
    const resultat = await appelerApi<{ message: string }>('/api/devis', { methode: 'POST', corps: corpsDevis(new FormData(event.currentTarget)), libelles: LIBELLES });
    setEnvoi(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      setErreursChamps(resultat.erreursChamps);
      return;
    }
    setMerci(resultat.donnees.message);
  }

  if (merci) {
    return (
      <main className="mx-auto max-w-xl px-5 py-8 lg:px-6 lg:py-12">
        <h1 className="font-titre text-4xl text-titre">Demande envoyée</h1>
        <p className="mt-4 leading-relaxed text-texte-doux">{merci} Un e-mail récapitulatif vient de vous être envoyé.</p>
        <Link href="/experiences" className="mt-8 inline-block underline">Découvrir les expériences</Link>
      </main>
    );
  }

  const optionsExperiences = Object.fromEntries(experiences.map(e => [String(e.id), e.titre]));
  const avecLieu = typeDemande === 'experience' || typeDemande === 'evenement';

  return (
    <main className="mx-auto max-w-xl px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="border-b border-texte pb-2 font-titre text-4xl text-titre">Contact</h1>
      <h2 className="mt-6 text-lg font-bold text-titre">Demande de devis</h2>
      <p className="mt-2 leading-relaxed text-texte-doux">Une expérience pour votre équipe, le studio podcast, un sponsoring ou un événement : décrivez votre projet, Julie vous rappelle sous 48 h.</p>

      <form onSubmit={envoyer} className="relative mt-8 grid gap-4">
        <ChampPiege />
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Nom et prénom" name="nom" autoComplete="name" required maxLength={120} erreur={erreursChamps.nom} />
          <Champ libelle="Entreprise ou organisation" name="entreprise" autoComplete="organization" required maxLength={500} erreur={erreursChamps.entreprise} />
          <Champ libelle="E-mail" name="email" type="email" autoComplete="email" required maxLength={254} erreur={erreursChamps.email} />
          <Champ libelle="Téléphone" name="telephone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} aide="Julie vous rappelle avant de répondre." erreur={erreursChamps.telephone} />
        </div>
        <ChampListe libelle="Votre demande" name="typeDemande" options={TYPES_DEVIS} vide="Choisir…" required value={typeDemande} onChange={e => setTypeDemande(e.target.value)} erreur={erreursChamps.typeDemande} />
        {typeDemande === 'experience' && (
          <ChampListe libelle="Expérience" name="experienceId" options={optionsExperiences} vide="Je ne sais pas encore" defaultValue={experienceId ? String(experienceId) : ''} erreur={erreursChamps.experienceId} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Nombre de participants" name="nbParticipants" type="number" min={1} max={10000} erreur={erreursChamps.nbParticipants} />
          <Champ libelle="Date souhaitée" name="dateSouhaitee" type="date" min={new Date().toISOString().slice(0, 10)} erreur={erreursChamps.dateSouhaitee} />
        </div>
        {avecLieu && <ChampListe libelle="Lieu souhaité" name="lieuSouhaite" options={LIEUX_DEVIS} vide="Indifférent" erreur={erreursChamps.lieuSouhaite} />}
        <ChampTexte libelle="Votre projet" name="message" required maxLength={10000} erreur={erreursChamps.message} />
        <CaseConsentement usage="pour qu’on me rappelle au sujet de ma demande" erreur={erreursChamps.consentement} />
        {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
        <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Envoi…' : 'Envoyer la demande'}</button>
      </form>
    </main>
  );
}
