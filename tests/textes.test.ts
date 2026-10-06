import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { champsDe, ressourceAdmin } from '../src/frontend/admin/ressources';
import type { Ligne } from '../src/frontend/admin/valeurs';
import { inscrire, preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let defaut: typeof import('../src/backend/contenus/textes-par-defaut');
let textes: typeof import('../src/backend/contenus/textes-pages');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  defaut = await import('../src/backend/contenus/textes-par-defaut');
  textes = await import('../src/backend/contenus/textes-pages');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const admin = { 'x-admin-key': 'local-test-admin' };
const avecId = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const idDe = async (page: string, cle: string) => (await prisma.textePage.findUniqueOrThrow({ where: { page_cle: { page, cle } } })).id;
const modifier = (id: number, corps: unknown, entetes: Record<string, string> = admin) =>
  textes.modifier(requete(`/api/textes/${id}`, { methode: 'PUT', corps, entetes }), avecId(id));
type Erreur = { error: string; details?: { champ: string; message: string }[] };

test('sans texte en base, les pages affichent les textes d’origine', async () => {
  const accueil = await textes.textesDePage('accueil');
  assert.equal(accueil.titre, 'Maison La recette');
  assert.equal(accueil.newsletterBouton, 'S’inscrire');
  assert.equal((await textes.textesDePage('studio')).bouton, 'Demander un devis studio');
});

test('le seed crée les textes manquants sans jamais remplacer un texte modifié', async () => {
  assert.equal(await defaut.creerTextesManquants(prisma), defaut.EMPLACEMENTS.length);
  await prisma.textePage.update({ where: { id: await idDe('accueil', 'titre') }, data: { texte: 'Texte de Julie' } });
  await prisma.textePage.delete({ where: { id: await idDe('studio', 'bouton') } });

  assert.equal(await defaut.creerTextesManquants(prisma), 1);
  assert.equal((await textes.textesDePage('accueil')).titre, 'Texte de Julie');
  assert.equal(await prisma.textePage.count(), defaut.EMPLACEMENTS.length);
});

test('modification : admin seulement, règles de l’emplacement, visible aussitôt sur la page', async () => {
  const titre = await idDe('a-propos', 'titre');
  assert.equal((await modifier(titre, { texte: 'Piraté' }, {})).status, 401);
  const client = await inscrire('textes-client@example.com');
  assert.equal((await textes.modifier(requete(`/api/textes/${titre}`, { methode: 'PUT', corps: { texte: 'Piraté' }, cookie: client.cookie }), avecId(titre))).status, 403);

  const vide = await modifier(titre, { texte: '   ' });
  assert.equal(vide.status, 400);
  assert.deepEqual((await vide.json() as Erreur).details, [{ champ: 'texte', message: 'Champ obligatoire.' }]);
  const tropLong = await modifier(titre, { texte: 'x'.repeat(defaut.LONGUEUR_MAX.titre + 1) });
  assert.deepEqual((await tropLong.json() as Erreur).details, [{ champ: 'texte', message: '120 caractères maximum.' }]);
  assert.equal((await modifier(titre, { texte: 'T', page: 'studio' })).status, 400); // champ inconnu refusé

  // Un titre tient sur une ligne ; un paragraphe garde ses retours à la ligne ; un texte facultatif peut être vidé.
  assert.equal((await modifier(titre, { texte: ' Notre   histoire\n à La Rochelle ' })).status, 200);
  assert.equal((await modifier(await idDe('a-propos', 'introduction'), { texte: 'Premier paragraphe.\n\nSecond paragraphe.' })).status, 200);
  assert.equal((await modifier(await idDe('accueil', 'mention'), { texte: '' })).status, 200);

  const aPropos = await textes.textesDePage('a-propos');
  assert.equal(aPropos.titre, 'Notre histoire à La Rochelle');
  assert.equal(aPropos.introduction, 'Premier paragraphe.\n\nSecond paragraphe.');
  assert.equal((await textes.textesDePage('accueil')).mention, '');
});

test('liste : publique et filtrée par page ; l’admin y retrouve les emplacements manquants', async () => {
  const studio = await (await textes.lister(requete('/api/textes?page=studio'))).json() as Ligne[];
  assert.deepEqual(studio.map(t => t.cle), ['surtitre', 'titre', 'introduction', 'projetTitre', 'projetTexte', 'bouton']);
  assert.equal((await textes.lister(requete('/api/textes?page=blog'))).status, 400);

  await prisma.textePage.delete({ where: { id: await idDe('studio', 'projetTitre') } });
  assert.equal((await (await textes.lister(requete('/api/textes?page=studio'))).json() as Ligne[]).length, 5);
  assert.equal((await (await textes.lister(requete('/api/textes?page=studio', { entetes: admin }))).json() as Ligne[]).length, 6);
});

test('admin : le formulaire s’adapte à l’emplacement et « Remettre le texte d’origine » renvoie le bon texte', async () => {
  const lignes = await (await textes.lister(requete('/api/textes', { entetes: admin }))).json() as Ligne[];
  const ligne = (page: string, cle: string) => lignes.find(l => l.page === page && l.cle === cle)!;
  const ressource = ressourceAdmin('textes')!;

  const [mention] = champsDe(ressource, ligne('accueil', 'mention'));
  assert.deepEqual([mention.type, mention.requis, mention.longueurMax], ['texteLong', false, 1000]);
  const [bouton] = champsDe(ressource, ligne('studio', 'bouton'));
  assert.deepEqual([bouton.type, bouton.requis, bouton.longueurMax, bouton.libelle], ['texte', true, 40, 'Encadré : bouton (vers la demande de devis)']);

  const titre = ligne('accueil', 'titre');
  assert.equal(titre.modifie, true);
  const remettre = ressource.actions!.find(a => a.id === 'origine')!;
  const corps = typeof remettre.corps === 'function' ? remettre.corps(titre) : remettre.corps;
  assert.equal((await modifier(Number(titre.id), corps)).status, 200);
  assert.equal((await textes.textesDePage('accueil')).titre, 'Maison La recette');
});
