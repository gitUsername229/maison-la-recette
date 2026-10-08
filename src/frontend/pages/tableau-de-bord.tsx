import type { ReactNode } from 'react';
import { formatDate, formatDateHeure, formatMois, formatPrix } from '@/frontend/format';
import { classeGrandBouton, classeSurtitre } from '@/frontend/styles/classes';

/** Chiffres du tableau de bord (src/backend/tableau-de-bord/donnees.ts) ; null : source qui ne répond pas. */
type Props = {
  donnees: {
    maintenant: Date;
    lienLuma: string;
    luma: {
      simulation: boolean;
      prochains: { id: string; titre: string; debut: Date; url: string; inscrits: number | null; capacite: number | null; remplissage: number | null }[];
      autresAVenir: number;
      mois: { evenements: number; illisibles: number; inscrits: number; chiffreAffaires: { centimes: number; devise: string } };
    } | null;
    devis: {
      ceMois: number;
      moisPrecedent: number;
      parType: { type: string; nombre: number }[];
      dernieres: { id: number; createdAt: Date; typeDemande: string; entreprise: string }[];
    } | null;
    newsletter: { total: number; ceMois: number } | null;
    podcast: { total: number; parType: Record<'complet' | 'extrait' | 'replay', number>; dernier: Date | null } | null;
    raccourcis: { nom: string; texte: string; url: string }[];
  };
};

const TYPES_DEVIS: Record<string, string> = { experience: 'Expérience', sponsoring: 'Sponsoring', studio: 'Studio', evenement: 'Événement' };

/** « 1 inscrit », « 3 inscrits » ; `forme` : le pluriel quand il ne suffit pas d'ajouter un s. */
const pluriel = (n: number, mot: string, forme = `${mot}s`) => `${n} ${n > 1 ? forme : mot}`;

function LienExterne({ href, children, className = 'underline underline-offset-4' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}<span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
}

/** Grande carte : un titre, un chiffre, une phrase simple. Sans chiffre (source muette) : un tiret. */
function Carte({ titre, chiffre, children }: { titre: string; chiffre: string | null; children: ReactNode }) {
  return (
    <li className="flex flex-col rounded-2xl bg-fond p-5">
      <h3 className="font-bold">{titre}</h3>
      <p className="mt-2 font-titre text-5xl text-titre">{chiffre ?? '—'}</p>
      <div className="mt-2 grid gap-1">{children}</div>
    </li>
  );
}

/** Jauge de remplissage d'un événement (décorative : le pourcentage est écrit à côté). */
function Jauge({ pourcentage }: { pourcentage: number }) {
  return (
    <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded-full bg-fond-doux">
      <div className="h-full rounded-full bg-fond-sombre" style={{ width: `${pourcentage}%` }} />
    </div>
  );
}

function texteInscrits(inscrits: number | null, capacite: number | null) {
  if (inscrits === null) return 'Inscrits non communiqués par Luma.';
  return capacite ? `${pluriel(inscrits, 'inscrit')} sur ${pluriel(capacite, 'place')}.` : `${pluriel(inscrits, 'inscrit')}, sans limite de places.`;
}

/**
 * /tableau-de-bord (privé) : les chiffres du mois en grandes cartes, les prochains événements Luma et leur
 * remplissage, le détail des devis, puis les raccourcis. Lecture seule, aucune donnée personnelle.
 */
export default function TableauDeBord({ donnees }: Props) {
  const { luma, devis, newsletter, podcast, raccourcis } = donnees;
  const mois = formatMois(donnees.maintenant);
  const lumaMuet = <p>Luma ne répond pas pour le moment. <LienExterne href={donnees.lienLuma}>Voir sur Luma</LienExterne></p>;
  const baseMuette = <p>Chiffres indisponibles pour le moment : la base de données ne répond pas.</p>;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={classeSurtitre}>Espace privé</p>
          <h1 className="mt-3 font-titre text-4xl text-titre">Tableau de bord</h1>
          <p className="mt-2 text-texte-doux">Les chiffres de {mois}, mis à jour à chaque visite.</p>
        </div>
        <form method="post" action="/api/tableau-de-bord/deconnexion" className="w-full sm:w-auto">
          <button type="submit" className={`${classeGrandBouton.contour} sm:w-auto`}>Se déconnecter</button>
        </form>
      </div>

      {luma?.simulation && (
        <p role="note" className="mt-6 rounded-2xl bg-secondaire px-4 py-3 font-bold text-sur-secondaire">
          Simulation Luma : les chiffres des événements sont fictifs.
        </p>
      )}

      <section aria-labelledby="en-bref" className="mt-8">
        <h2 id="en-bref" className="sr-only">En bref</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Carte titre="Inscrits aux événements" chiffre={luma && String(luma.mois.inscrits)}>
            {!luma ? lumaMuet : (
              <>
                <p>{luma.mois.evenements ? `Sur ${pluriel(luma.mois.evenements, 'événement')} en ${mois}.` : `Aucun événement en ${mois}.`}</p>
                {luma.mois.illisibles > 0 && <p className="text-texte-doux">Sans compter {pluriel(luma.mois.illisibles, 'événement')} dont Luma n’a pas donné les inscrits.</p>}
              </>
            )}
          </Carte>
          <Carte titre="Chiffre d’affaires estimé" chiffre={luma && formatPrix(luma.mois.chiffreAffaires.centimes, luma.mois.chiffreAffaires.devise)}>
            {luma ? <p>En {mois} : prix × inscrits des événements payants, avant frais Luma.</p> : lumaMuet}
          </Carte>
          <Carte titre="Demandes de devis" chiffre={devis && String(devis.ceMois)}>
            {devis ? <p>En {mois}, contre {devis.moisPrecedent} le mois dernier.</p> : baseMuette}
          </Carte>
          <Carte titre="Newsletter" chiffre={newsletter && String(newsletter.total)}>
            {newsletter ? <p>Inscrits en tout, dont {pluriel(newsletter.ceMois, 'nouveau', 'nouveaux')} en {mois}.</p> : baseMuette}
          </Carte>
          <Carte titre="Podcast" chiffre={podcast && String(podcast.total)}>
            {!podcast ? <p>Le flux Ausha ne répond pas pour le moment.</p> : (
              <>
                <p>Épisodes publiés sur Ausha : {pluriel(podcast.parType.complet, 'complet')}, {pluriel(podcast.parType.extrait, 'extrait')}, {pluriel(podcast.parType.replay, 'replay')}.</p>
                {podcast.dernier && <p>Dernier épisode le {formatDate(podcast.dernier)}.</p>}
              </>
            )}
          </Carte>
          <Carte titre="Statistiques du site" chiffre="Bientôt">
            <p>Bientôt disponible (Plausible, à la mise en ligne).</p>
          </Carte>
        </ul>
      </section>

      <section aria-labelledby="prochains" className="mt-12">
        <h2 id="prochains" className="text-xl font-bold text-titre">Prochains événements</h2>
        {!luma ? <div className="mt-4 rounded-2xl bg-fond p-5">{lumaMuet}</div> : luma.prochains.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-fond p-5">Aucun événement à venir sur Luma. <LienExterne href={donnees.lienLuma}>Voir sur Luma</LienExterne></p>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {luma.prochains.map(e => (
                <li key={e.id} className="flex flex-col rounded-2xl bg-fond p-5">
                  <p className="text-texte-doux">{formatDateHeure(e.debut)}</p>
                  <h3 className="mt-1 text-xl font-bold">{e.titre}</h3>
                  <p className="mt-3">{texteInscrits(e.inscrits, e.capacite)}</p>
                  {e.remplissage !== null && (
                    <>
                      <Jauge pourcentage={e.remplissage} />
                      <p className="mt-1 font-bold">Rempli à {e.remplissage} %</p>
                    </>
                  )}
                  <p className="mt-auto pt-4"><LienExterne href={e.url}>Voir le détail sur Luma<span className="sr-only"> : {e.titre}</span></LienExterne></p>
                </li>
              ))}
            </ul>
            {luma.autresAVenir > 0 && <p className="mt-3">Et {pluriel(luma.autresAVenir, 'autre événement', 'autres événements')} à venir, <LienExterne href={donnees.lienLuma}>à voir sur Luma</LienExterne>.</p>}
          </>
        )}
      </section>

      <section aria-labelledby="devis" className="mt-12">
        <h2 id="devis" className="text-xl font-bold text-titre">Demandes de devis</h2>
        {!devis ? <div className="mt-4 rounded-2xl bg-fond p-5">{baseMuette}</div> : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-fond p-5">
              <h3 className="font-bold">Par type, sur les 12 derniers mois</h3>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                {devis.parType.map(({ type, nombre }) => (
                  <div key={type} className="contents"><dt>{TYPES_DEVIS[type] ?? type}</dt><dd className="text-right font-bold">{nombre}</dd></div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl bg-fond p-5">
              <h3 className="font-bold">Les 5 dernières</h3>
              {devis.dernieres.length === 0 ? <p className="mt-3">Aucune demande pour le moment.</p> : (
                <ol className="mt-3 grid gap-2">
                  {devis.dernieres.map(d => (
                    <li key={d.id}>
                      <span className="text-texte-doux">{formatDate(d.createdAt)}</span> · {TYPES_DEVIS[d.typeDemande] ?? d.typeDemande} · <span className="font-bold">{d.entreprise}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="raccourcis" className="mt-12">
        <h2 id="raccourcis" className="text-xl font-bold text-titre">Raccourcis</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {raccourcis.map(r => (
            <li key={r.nom}>
              <LienExterne href={r.url} className="flex h-full flex-col rounded-2xl bg-fond p-5 hover:underline">
                <span className="text-xl font-bold text-titre">{r.nom}</span>
                <span className="mt-1">{r.texte}</span>
              </LienExterne>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
