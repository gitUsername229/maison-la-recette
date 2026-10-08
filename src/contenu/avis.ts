// Avis affichés sur le site (accueil, onglets Expériences, À propos), du plus récent au plus ancien.
// nom : prénom et âge (« Claire, 52 ans ») ; date : affichée après le nom (sinon le contexte) ; note : 1 à 5, ou null.

export type Avis = { nom: string; citation: string; contexte: string; note: number | null; date: string | null; demo?: boolean };

/** Les trois premiers sont des avis fictifs de démonstration (demo: true) : à remplacer avant la mise en ligne. */
export const AVIS: Avis[] = [
  { nom: 'Claire, 52 ans', citation: 'On est reparti avec des recettes, des adresses et l’envie de cuisiner autrement.', contexte: 'Atelier cuisine anti-gaspi', note: 5, date: '2026-09-26', demo: true },
  { nom: 'Mathieu, 40 ans', citation: 'Une matinée passionnante à la rencontre des producteurs du marché.', contexte: 'Food tour : marché et producteurs', note: 4, date: '2026-09-12', demo: true },
  { nom: 'Inès, 34 ans', citation: 'Convivial, concret et plein d’astuces pour ne plus rien jeter.', contexte: 'Atelier cuisine anti-gaspi', note: 5, date: '2026-08-28', demo: true },
];
