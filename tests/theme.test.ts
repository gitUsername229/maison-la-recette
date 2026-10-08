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

test('palette : les variables de la maquette Figma, le vert de l’en-tête, et pas de noir pur', () => {
  assert.deepEqual(
    { fond: palette['fond-clair'], texte: palette['vert-fonce'], vert: palette['vert-tendre'], olive: palette['vert-olive'], orange: palette.orange, entete: palette['vert-entete'] },
    { fond: '#e9edd7', texte: '#123f1b', vert: '#bdd3a7', olive: '#90ae2d', orange: '#f57f03', entete: '#146048' },
  );
  // Corail de la maquette (#e75a47) assombri sans changer de teinte : mêmes proportions rouge / vert / bleu.
  const [r, v, b] = rvb(palette.corail);
  assert.ok(r < 0xe7 && Math.abs(v / r - 0x5a / 0xe7) < 0.01 && Math.abs(b / r - 0x47 / 0xe7) < 0.01);
  assert.ok(!Object.values(palette).includes('#000000'));
});

test('contrastes WCAG AA des couleurs employées ensemble', () => {
  // [texte ou élément, fond, minimum] : 4,5 pour le texte, 3 pour les contours de champs et le focus.
  const couples: [string, string, number][] = [
    ['texte', 'fond', 4.5], ['texte', 'fond-doux', 4.5], ['texte', 'surface', 4.5], ['texte', 'pastel', 4.5], ['texte', 'pastel-chaud', 4.5],
    ['texte-doux', 'fond', 4.5], ['texte-doux', 'fond-doux', 4.5], ['texte-doux', 'surface', 4.5],
    ['primaire', 'fond', 4.5], ['accent', 'fond-doux', 4.5], ['erreur', 'surface', 4.5],
    ['sur-primaire', 'primaire', 4.5], ['sur-primaire', 'primaire-fort', 4.5],
    ['sur-secondaire', 'secondaire', 4.5], ['sur-secondaire', 'secondaire-clair', 4.5],
    ['accent', 'fond', 4.5], ['accent', 'surface', 4.5], ['sur-accent', 'accent', 4.5],
    ['erreur', 'erreur-fond', 4.5], ['erreur', 'fond', 4.5], ['succes', 'succes-fond', 4.5],
    ['sur-fond-sombre', 'fond-sombre', 4.5], ['lien-sur-sombre', 'fond-sombre', 4.5], ['sur-fond-sombre', 'voile', 4.5],
    ['bordure-forte', 'fond', 3], ['bordure-forte', 'surface', 3],
    ['texte', 'fond', 3], ['sur-fond-sombre', 'fond-sombre', 3], // contour de focus (sombre sur clair, blanc sur vert foncé)
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

test('orange et vert olive : décor uniquement, jamais en couleur de texte', () => {
  const texteDecor = fichiers('src').filter(f => /\btext-decor(-vert)?\b/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(texteDecor, []);
});

test('police Inria Serif partout, avec polices de secours', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /Inria_Serif\(\{[^}]*variable: '--police-site'[^}]*fallback: \[[^\]]*'serif'\]/);
  assert.match(CSS, /--font-serif: var\(--police-site\)/);
  assert.match(CSS, /--font-sans: var\(--police-site\)/);
});

test('échelle typographique : texte courant à 16 px minimum, étiquettes à 14 px minimum', () => {
  const taille = (nom: string) => Number((new RegExp(`--text-${nom}: ([\\d.]+)rem;`).exec(CSS) ?? assert.fail(`--text-${nom} absent`))[1]) * 16;
  assert.ok(taille('sm') >= 16 && taille('base') >= 16, 'texte courant sous 16 px');
  assert.ok(taille('xs') >= 14, 'étiquettes sous 14 px');
  const echelle = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].map(taille);
  assert.deepEqual(echelle, [...echelle].sort((a, b) => a - b)); // croissante
});

test('icônes de la maquette : chaque nom a son fichier SVG', () => {
  const source = readFileSync('src/frontend/components/Icone.tsx', 'utf8');
  const noms = [...(/type NomIcone = ([^;]+);/.exec(source) ?? assert.fail('NomIcone introuvable'))[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
  assert.ok(noms.length >= 8);
  const manquantes = noms.filter(nom => !statSync(`public/images/icones/${nom}.svg`, { throwIfNoEntry: false }));
  assert.deepEqual(manquantes, []);
});

test('aucun émoji dans l’interface du site', () => {
  const avecEmoji = fichiers('src').filter(f => /\p{Emoji_Presentation}|\uFE0F/u.test(readFileSync(f, 'utf8')));
  assert.deepEqual(avecEmoji, []);
});
