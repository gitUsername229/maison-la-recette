'use client';

import Link from 'next/link';
import { useState } from 'react';
import Champ, { ChampListe, ChampTexte } from '@/frontend/components/Champ';
import { LIEUX_DEVIS, TYPES_DEVIS } from '@/frontend/format';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';

type Props = {
  utilisateur: { nom: string; email: string; telephone: string | null };
  experiences: { id: number; titre: string }[];
  experienceId?: number;
};

type Donnees = Record<string, string | number>;

/** Champs du formulaire → corps de POST /api/devis (champs vides retirés, nombres convertis). */
function corpsDevis(formulaire: FormData): Donnees {
  const corps: Donnees = {};
  for (const [cle, valeur] of formulaire.entries()) {
    const texte = String(valeur).trim();
    if (!texte) continue;
    corps[cle] = cle === 'experienceId' || cle === 'nbParticipants' ? Number(texte) : texte;
  }
  return corps;
}

export default function Contact({ utilisateur, experiences, experienceId }: Props) {
  const [typeDemande, setTypeDemande] = useState(experienceId ? 'experience' : '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);

  async function envoyer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpsDevis(new FormData(event.currentTarget))),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? 'La demande n’a pas pu être envoyée.');
        return;
      }
      setEnvoyee(true);
    } catch {
      setErreur('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  if (envoyee) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 sm:py-16">
        <h1 className="font-serif text-4xl">Demande envoyée</h1>
        <p className="mt-4 leading-relaxed text-texte-doux">Merci ! Julie vous rappelle sous 48 h pour en parler.</p>
        <Link href="/compte" className="mt-8 inline-block underline">Suivre mes demandes</Link>
      </main>
    );
  }

  const optionsExperiences = Object.fromEntries(experiences.map(e => [String(e.id), e.titre]));
  const avecLieu = typeDemande === 'experience' || typeDemande === 'evenement';

  return (
    <main className="mx-auto max-w-xl px-6 py-12 sm:py-16">
      <h1 className="font-serif text-4xl">Demande de devis</h1>
      <p className="mt-3 leading-relaxed text-texte-doux">Une expérience pour votre équipe, le studio podcast, un sponsoring ou un événement : décrivez votre projet, Julie vous rappelle sous 48 h.</p>

      <div className="mt-8 rounded-xl bg-surface p-4 text-sm ring-1 ring-bordure">
        <p className="font-medium">Vos coordonnées</p>
        <p className="mt-1 text-texte-doux">{utilisateur.nom} · {utilisateur.email}{utilisateur.telephone && ` · ${utilisateur.telephone}`}</p>
      </div>

      <form onSubmit={envoyer} className="mt-6 grid gap-4">
        {!utilisateur.telephone && (
          <Champ libelle="Téléphone" name="telephone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} aide="Julie vous rappelle avant de répondre. Il sera ajouté à votre compte." />
        )}
        <ChampListe libelle="Votre demande" name="typeDemande" options={TYPES_DEVIS} vide="Choisir…" required value={typeDemande} onChange={e => setTypeDemande(e.target.value)} />
        {typeDemande === 'experience' && (
          <ChampListe libelle="Expérience" name="experienceId" options={optionsExperiences} vide="Je ne sais pas encore" defaultValue={experienceId ? String(experienceId) : ''} />
        )}
        <Champ libelle="Entreprise ou organisation" name="entreprise" required maxLength={500} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Nombre de participants" name="nbParticipants" type="number" min={1} max={10000} />
          <Champ libelle="Date souhaitée" name="dateSouhaitee" type="date" min={new Date().toISOString().slice(0, 10)} />
        </div>
        {avecLieu && <ChampListe libelle="Lieu souhaité" name="lieuSouhaite" options={LIEUX_DEVIS} vide="Indifférent" />}
        <ChampTexte libelle="Votre projet" name="message" required maxLength={10000} />
        {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
        <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Envoi…' : 'Envoyer la demande'}</button>
      </form>
    </main>
  );
}
