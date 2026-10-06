import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChampAdmin } from '../src/frontend/admin/ressources';
import { corpsFormulaire, valeurInitiale } from '../src/frontend/admin/valeurs';

const champ = (nom: string, type: ChampAdmin['type'], options: Partial<ChampAdmin> = {}): ChampAdmin => ({ nom, libelle: nom, type, ...options });

const CHAMPS = [
  champ('experienceId', 'experience', { creationSeulement: true }),
  champ('prixCents', 'prix', { nullable: true }),
  champ('placesTotal', 'nombre'),
  champ('dateDebut', 'dateHeure'),
  champ('actif', 'booleen'),
  champ('imageAlt', 'texte'),
  champ('lieu', 'texte', { nullable: true }),
];

function formulaire(valeurs: Record<string, string>) {
  const donnees = new FormData();
  for (const [cle, valeur] of Object.entries(valeurs)) donnees.append(cle, valeur);
  return donnees;
}

test('le formulaire admin convertit euros, dates, cases à cocher et champs vides', () => {
  const corps = corpsFormulaire(CHAMPS, formulaire({ experienceId: '3', prixCents: '45,50', placesTotal: '12', dateDebut: '2026-11-14T10:00', imageAlt: '', lieu: '' }), true);
  assert.deepEqual(corps, {
    experienceId: 3, prixCents: 4550, placesTotal: 12, dateDebut: new Date('2026-11-14T10:00').toISOString(),
    actif: false, imageAlt: '', lieu: null,
  });
});

test('en modification : champ « création seulement » ignoré, prix vide effacé, nombre vide non envoyé', () => {
  const corps = corpsFormulaire(CHAMPS, formulaire({ experienceId: '3', prixCents: '', placesTotal: '', dateDebut: '', actif: 'on', imageAlt: 'Photo', lieu: 'La Rochelle' }), false);
  assert.deepEqual(corps, { prixCents: null, actif: true, imageAlt: 'Photo', lieu: 'La Rochelle' });
});

test('les valeurs en base sont préremplies au format des champs, sans décalage horaire', () => {
  const ligne = { id: 1, prixCents: 4500, actif: true, dateDebut: '2026-11-14T09:00:00.000Z', lieu: null };
  assert.equal(valeurInitiale(CHAMPS[1], ligne), '45.00');
  assert.equal(valeurInitiale(CHAMPS[4], ligne), true);
  assert.equal(valeurInitiale(CHAMPS[6], ligne), '');
  // Aller-retour : la date affichée puis renvoyée retombe sur la même heure.
  const affichee = String(valeurInitiale(CHAMPS[3], ligne));
  assert.equal(corpsFormulaire([CHAMPS[3]], formulaire({ dateDebut: affichee }), false).dateDebut, ligne.dateDebut);
  assert.equal(valeurInitiale(champ('visible', 'booleen', { defaut: true }), null), true);
});
