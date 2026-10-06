import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { inscrire, preparerBaseDeTest, requete } from './outils';

let nettoyer: () => Promise<void>;
let prisma: PrismaClient;
let catalogue: typeof import('../src/backend/ateliers/catalogue');
let devis: typeof import('../src/backend/ateliers/devis');
let contenus: typeof import('../src/backend/contenus/contenus');
let images: typeof import('../src/backend/contenus/images');
let compte: typeof import('../src/backend/comptes/compte');
let newsletter: typeof import('../src/backend/contenus/newsletter');

before(async () => {
  nettoyer = await preparerBaseDeTest();
  ({ prisma } = await import('../src/backend/db/prisma'));
  catalogue = await import('../src/backend/ateliers/catalogue');
  devis = await import('../src/backend/ateliers/devis');
  contenus = await import('../src/backend/contenus/contenus');
  images = await import('../src/backend/contenus/images');
  compte = await import('../src/backend/comptes/compte');
  newsletter = await import('../src/backend/contenus/newsletter');
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  await nettoyer?.();
});

const admin = (chemin: string, methode: string, corps?: unknown) =>
  requete(chemin, { methode, corps, entetes: { 'x-admin-key': process.env.ADMIN_KEY! } });
const avecId = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
type Erreur = { error: string; suggestion?: string; details?: { champ: string; message: string }[] };

async function atelierAvecReservation() {
  const experience = await prisma.experience.create({ data: { slug: `atelier-${Date.now()}`, type: 'atelier', titre: 'Atelier', accroche: 'A', description: 'D', dureeMin: 60, prixCents: 4500, capaciteMax: 10, image: '', imageAlt: '' } });
  const debut = new Date(Date.now() + 7 * 86400_000);
  const session = await prisma.session.create({ data: { experienceId: experience.id, dateDebut: debut, dateFin: new Date(debut.getTime() + 7200_000), lieu: 'La Rochelle', placesTotal: 6, placesPrises: 3 } });
  await prisma.reservation.create({ data: { sessionId: session.id, nom: 'Camille', email: 'c@example.com', nbPersonnes: 3, montantCents: 13500, statut: 'payee' } });
  return { experience, session };
}

test('une expérience avec des sessions ne se supprime pas : on propose de la masquer', async () => {
  const { experience } = await atelierAvecReservation();
  const reponse = await catalogue.deleteExperience(admin(`/api/experiences/${experience.id}`, 'DELETE'), avecId(experience.id));
  assert.equal(reponse.status, 409);
  const corps = await reponse.json() as Erreur;
  assert.equal(corps.suggestion, 'masquer');
  assert.match(corps.error, /1 session.*Masquez-la/);
  assert.ok(await prisma.experience.findUnique({ where: { id: experience.id } }));
});

test('une session réservée ne se supprime pas (on propose de la fermer), et ses places ne descendent pas sous les ventes', async () => {
  const { session } = await atelierAvecReservation();
  const suppression = await catalogue.deleteSession(admin(`/api/sessions/${session.id}`, 'DELETE'), avecId(session.id));
  assert.equal(suppression.status, 409);
  assert.equal((await suppression.json() as Erreur).suggestion, 'fermer');

  const tropPeu = await catalogue.updateSession(admin(`/api/sessions/${session.id}`, 'PUT', { placesTotal: 2 }), avecId(session.id));
  assert.equal(tropPeu.status, 409);
  assert.deepEqual((await tropPeu.json() as Erreur).details?.map(d => d.champ), ['placesTotal']);

  // Le formulaire renvoie aussi date et lieu inchangés : ajouter des places doit fonctionner.
  const formulaire = { dateDebut: session.dateDebut.toISOString(), dateFin: session.dateFin.toISOString(), lieu: session.lieu, placesTotal: 8 };
  assert.equal((await catalogue.updateSession(admin(`/api/sessions/${session.id}`, 'PUT', formulaire), avecId(session.id))).status, 200);
  assert.equal((await catalogue.updateSession(admin(`/api/sessions/${session.id}`, 'PUT', { statut: 'complete' }), avecId(session.id))).status, 200);
});

test('les erreurs de saisie disent, en français, quel champ corriger', async () => {
  const manquant = await contenus.avis.creer(admin('/api/avis', 'POST', { nom: 'Claire', contexte: 'Atelier' }));
  assert.equal(manquant.status, 400);
  assert.deepEqual((await manquant.json() as Erreur).details, [{ champ: 'citation', message: 'Champ obligatoire.' }]);

  const article = { titre: 'T', slug: 'meme-adresse', extrait: 'E', contenu: 'C', image: '', imageAlt: '' };
  assert.equal((await contenus.articles.creer(admin('/api/articles', 'POST', article))).status, 201);
  const doublon = await contenus.articles.creer(admin('/api/articles', 'POST', article));
  assert.equal(doublon.status, 409);
  assert.deepEqual((await doublon.json() as Erreur).details?.map(d => d.champ), ['slug']);
});

test('devis : note interne enregistrée mais jamais montrée au client, suppression possible', async () => {
  const client = await inscrire('devis-note@example.com', '0600000003');
  const { id } = await prisma.demandeDevis.create({ data: { entreprise: 'Acme', contactNom: 'C', email: 'devis-note@example.com', typeDemande: 'studio', message: 'M', userId: client.id } });

  assert.equal((await devis.updateDevis(admin(`/api/devis/${id}`, 'PATCH', { noteInterne: 'Rappeler jeudi', statut: 'en_cours' }), avecId(id))).status, 200);
  assert.equal((await prisma.demandeDevis.findUniqueOrThrow({ where: { id } })).noteInterne, 'Rappeler jeudi');
  const vueClient = await (await compte.getCompte(requete('/api/compte', { cookie: client.cookie }))).text();
  assert.ok(!vueClient.includes('Rappeler jeudi'));

  assert.equal((await devis.deleteDevis(admin(`/api/devis/${id}`, 'DELETE'), avecId(id))).status, 200);
  assert.equal(await prisma.demandeDevis.count({ where: { id } }), 0);
});

test('photo remplacée : l’ancien fichier est supprimé du disque', async () => {
  const dossier = join(process.cwd(), 'public/images/uploads');
  const [ancienne, nouvelle] = ['/images/uploads/test-ancienne.png', '/images/uploads/test-nouvelle.png'];
  await Promise.all([ancienne, nouvelle].map(url => writeFile(join(process.cwd(), 'public', url), 'x')));
  try {
    const { id } = await prisma.image.create({ data: { url: ancienne, alt: 'Atelier', page: '/a-propos' } });
    assert.equal((await images.images.modifier(admin(`/api/images/${id}`, 'PUT', { url: nouvelle }), avecId(id))).status, 200);
    assert.equal(existsSync(join(process.cwd(), 'public', ancienne)), false);
    assert.equal(existsSync(join(process.cwd(), 'public', nouvelle)), true);
  } finally {
    await Promise.all(['test-ancienne.png', 'test-nouvelle.png'].map(f => rm(join(dossier, f), { force: true })));
  }
});

test('newsletter : inscription publique sans révéler les abonnés ; liste et suppression réservées à l’admin', async () => {
  const inscrire = () => newsletter.inscrire(requete('/api/newsletter', { methode: 'POST', corps: { email: ' Lecteur@Example.com ' } }));
  const [premiere, seconde] = [await inscrire(), await inscrire()];
  assert.deepEqual([premiere.status, seconde.status], [201, 201]);
  assert.deepEqual(await premiere.json(), await seconde.json()); // même réponse : on ne sait pas si l'adresse était déjà inscrite
  assert.equal(await prisma.newsletter.count({ where: { email: 'lecteur@example.com' } }), 1);

  assert.equal((await newsletter.lister(requete('/api/newsletter'))).status, 401);
  const { id } = await prisma.newsletter.findUniqueOrThrow({ where: { email: 'lecteur@example.com' } });
  assert.equal((await newsletter.supprimer(admin(`/api/newsletter/${id}`, 'DELETE'), avecId(id))).status, 200);
  assert.equal(await prisma.newsletter.count(), 0);
});
