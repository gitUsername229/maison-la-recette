import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Le thème vit dans un seul fichier : on y lit la palette et les rôles, puis on vérifie les contrastes (WCAG AA)
// et l'absence de couleur en dur ailleurs.
const CSS = readFileSync('src/frontend/styles/globals.css', 'utf8');

const palette = Object.fromEntries([...CSS.matchAll(/^\s*--([a-z-]+):\s*(#[0-9a-f]{6});/gim)].map(m => [m[1], m[2].toLowerCase()]));
const roles = Object.fromEntries([...CSS.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)].filter(m => m[1] !== '*').map(m => [m[1], m[2].trim()]));

type Rvb = [number, number, number];
const rvb = (hex: string): Rvb => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rvb;

/** Valeur d'un rôle : #hex, var(--palette) ou color-mix(in srgb, A N%, B), comme dans globals.css. */
function couleur(valeur: string): Rvb {
  if (valeur.startsWith('#')) return rvb(valeur.toLowerCase());
  const variable = /^var\(--([a-z-]+)\)$/.exec(valeur);
  if (variable) return rvb(palette[variable[1]] ?? assert.fail(`couleur inconnue : ${valeur}`));
  const melange = /^color-mix\(in srgb, (.+) (\d+)%, (.+)\)$/.exec(valeur) ?? assert.fail(`valeur non prise en charge : ${valeur}`);
  const [a, b, p] = [couleur(melange[1]), couleur(melange[3]), Number(melange[2]) / 100];
  return a.map((c, i) => Math.round(c * p + b[i] * (1 - p))) as Rvb;
}
const role = (nom: string) => couleur(roles[nom] ?? assert.fail(`rôle inconnu : ${nom}`));

const luminance = (c: Rvb) => {
  const [r, v, b] = c.map(x => x / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
};
const contraste = (a: Rvb, b: Rvb) => {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
};

test('palette : 6 couleurs nommées, sans noir pur', () => {
  assert.deepEqual(Object.keys(palette), ['creme', 'foret', 'salade', 'pousse', 'tomate', 'citron']);
  assert.ok(!Object.values(palette).includes('#000000'));
});

test('contrastes WCAG AA des couleurs employées ensemble', () => {
  // [texte ou élément, fond, minimum] : 4,5 pour le texte, 3 pour les contours de champs et le focus.
  const couples: [string, string, number][] = [
    ['texte', 'fond', 4.5], ['texte', 'surface', 4.5], ['texte', 'pastel', 4.5], ['texte', 'pastel-chaud', 4.5],
    ['texte-doux', 'fond', 4.5], ['texte-doux', 'surface', 4.5], ['texte-doux', 'pastel', 4.5],
    ['primaire', 'fond', 4.5], ['primaire', 'surface', 4.5],
    ['sur-primaire', 'primaire', 4.5], ['sur-primaire', 'primaire-fort', 4.5],
    ['accent', 'fond', 4.5], ['accent', 'surface', 4.5], ['sur-accent', 'accent', 4.5],
    ['erreur', 'erreur-fond', 4.5], ['erreur', 'surface', 4.5], ['succes', 'succes-fond', 4.5],
    ['sur-fond-sombre', 'fond-sombre', 4.5], ['lien-sur-sombre', 'fond-sombre', 4.5],
    ['bordure-forte', 'surface', 3], ['bordure-forte', 'fond', 3], ['primaire', 'fond', 3],
  ];
  const echecs = couples
    .map(([avant, fond, minimum]) => ({ couple: `${avant} sur ${fond}`, ratio: contraste(role(avant), role(fond)), minimum }))
    .filter(c => c.ratio < c.minimum)
    .map(c => `${c.couple} : ${c.ratio.toFixed(2)} < ${c.minimum}`);
  assert.deepEqual(echecs, []);
});

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap(nom => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : /\.(tsx?|css)$/.test(nom) ? [chemin] : [];
  });
}

test('aucune couleur en dur hors du fichier de thème', () => {
  // Les e-mails gardent leurs couleurs (les messageries ne lisent pas les variables CSS).
  const exceptions = ['src/frontend/styles/globals.css', 'src/backend/mails/modeles.ts'];
  const COULEUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:bg|text|border|ring|divide|decoration|accent|fill|stroke|outline|from|to|via)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b|-\[#/i;
  const trouvees = fichiers('src')
    .filter(f => !exceptions.includes(f.replaceAll('\\', '/')))
    .flatMap(f => readFileSync(f, 'utf8').split('\n').map((ligne, i) => ({ f, i, ligne })))
    .filter(({ ligne }) => COULEUR.test(ligne))
    .map(({ f, i, ligne }) => `${f}:${i + 1} ${ligne.trim().slice(0, 120)}`);
  assert.deepEqual(trouvees, []);
});

test('polices : serif pour les titres, sans-serif pour le texte, avec polices de secours', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /Fraunces\(\{[^}]*variable: '--police-titres'[^}]*fallback: \[[^\]]*'serif'\]/);
  assert.match(layout, /DM_Sans\(\{[^}]*variable: '--police-texte'[^}]*fallback: \[[^\]]*'sans-serif'\]/);
  assert.equal(roles['font-serif'], undefined); // les polices ne sont pas des couleurs
  assert.match(CSS, /--font-serif: var\(--police-titres\)/);
  assert.match(CSS, /--font-sans: var\(--police-texte\)/);
});
