import 'server-only';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { estCategorie, libelleCategorie, type CategorieBlog } from './categories-blog';

// Articles du blog : un fichier Markdown par article dans src/contenu/blog/. Le nom du fichier est l'adresse
// (mon-article.md → /blog/mon-article). En tête du fichier, entre deux lignes « --- », une ligne « clé: valeur »
// par information (voir les articles existants) ; le texte de l'article suit, en Markdown.

export const DOSSIER_BLOG = join(process.cwd(), 'src/contenu/blog');

const oui = z.enum(['oui', 'non']).transform(v => v === 'oui');
const liste = z.string().transform(v => v.split(',').map(s => s.trim()).filter(Boolean));

const enTeteSchema = z.object({
  titre: z.string().min(1),
  extrait: z.string().min(1),
  image: z.string().regex(/^\/images\/[\w/.-]+$/, 'chemin attendu : /images/…').or(z.literal('')).default(''),
  imageAlt: z.string().default(''),
  categorie: z.string().refine(estCategorie, 'catégorie inconnue (voir src/backend/contenus/categories-blog.ts)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date attendue : AAAA-MM-JJ').transform(v => new Date(`${v}T08:00:00Z`)),
  publie: oui.default(true),
  experiences: liste.default([]),     // slugs des expériences liées (src/contenu/experiences.ts), séparés par des virgules
  episode: z.string().optional(),     // titre exact de l'épisode du podcast lié (tel qu'affiché sur Ausha)
});

export type ArticleBlog = {
  slug: string;
  titre: string;
  extrait: string;
  image: string;
  imageAlt: string;
  categorie: CategorieBlog;
  categorieLibelle: string;
  datePublication: Date;
  publie: boolean;
  experiences: string[];
  episode: string | null;
  contenu: string;
};

/** Lit un article : en-tête « clé: valeur » entre deux lignes « --- », puis le Markdown. Lève une erreur claire sinon. */
export function lireArticle(slug: string, texte: string): ArticleBlog {
  const morceaux = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texte);
  if (!morceaux) throw new Error('en-tête manquant : le fichier doit commencer par une ligne « --- »');
  const champs = Object.fromEntries(morceaux[1].split(/\r?\n/).filter(l => l.trim()).map(ligne => {
    const separation = ligne.indexOf(':');
    if (separation < 1) throw new Error(`ligne d’en-tête illisible : « ${ligne} » (attendu « clé: valeur »)`);
    return [ligne.slice(0, separation).trim(), ligne.slice(separation + 1).trim()];
  }));
  const resultat = enTeteSchema.safeParse(champs);
  if (!resultat.success) throw new Error(resultat.error.issues.map(i => `${i.path.join('.') || 'en-tête'} : ${i.message}`).join(' ; '));
  const { date, categorie, episode, ...enTete } = resultat.data;
  return {
    slug, ...enTete, categorie: categorie as CategorieBlog, categorieLibelle: libelleCategorie(categorie),
    datePublication: date, episode: episode || null, contenu: morceaux[2].trim(),
  };
}

/**
 * Tous les articles du dossier, les plus récents d'abord. Un fichier mal rempli est ignoré et signalé dans le
 * terminal (le reste du blog reste en ligne). Relu à chaque affichage : un article ajouté apparaît aussitôt.
 */
export function tousLesArticles(dossier = DOSSIER_BLOG): ArticleBlog[] {
  return readdirSync(dossier)
    .filter(fichier => fichier.endsWith('.md'))
    .flatMap(fichier => {
      const slug = fichier.slice(0, -3);
      try {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('nom de fichier : minuscules, chiffres et tirets uniquement');
        return [lireArticle(slug, readFileSync(join(dossier, fichier), 'utf8'))];
      } catch (erreur) {
        console.error(`[blog] ${fichier} ignoré : ${erreur instanceof Error ? erreur.message : erreur}`);
        return [];
      }
    })
    .sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());
}

/** Articles publiés (publie: oui), éventuellement d'une seule catégorie. */
export const articlesPublies = (categorie?: CategorieBlog) =>
  tousLesArticles().filter(a => a.publie && (!categorie || a.categorie === categorie));
