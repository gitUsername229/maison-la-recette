import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import ProchainesDates from '@/frontend/components/ProchainesDates';
import ReservationForm, { type SessionDisponible } from '@/frontend/components/ReservationForm';
import { formatDuree, formatPrix, libelleType } from '@/frontend/format';
import { classeBouton } from '@/frontend/styles/classes';

export type ExperienceDetail = {
  slug: string;
  type: string;
  titre: string;
  accroche: string;
  description: string;
  dureeMin: number;
  lieu: string | null;
  prixCents: number;
  reservableEnLigne: boolean;
  image: string;
  imageAlt: string;
  images: PhotoGalerie[];
  sessions: SessionDisponible[];
};

type Props = {
  experience: ExperienceDetail;
  // Compte connecté, ou null pour un visiteur (invité à se connecter avant de réserver).
  utilisateur: { nom: string; email: string } | null;
};

export default function Experience({ experience, utilisateur }: Props) {
  const retour = encodeURIComponent(`/experiences/${experience.slug}`);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <Link href="/experiences" className="text-sm text-stone-500 hover:text-stone-800">← Toutes les expériences</Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <article>
          <p className="text-xs uppercase tracking-widest text-stone-500">{libelleType(experience.type)}</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{experience.titre}</h1>
          <p className="mt-5 text-lg leading-relaxed">{experience.accroche}</p>
          {experience.image && <Image src={experience.image} alt={experience.imageAlt} width={1200} height={750} priority className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover" />}

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-stone-300 pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-stone-500">Durée</dt>
              <dd className="mt-1">{formatDuree(experience.dureeMin)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Lieu</dt>
              <dd className="mt-1">{experience.lieu ?? 'Précisé à la réservation'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Tarif</dt>
              <dd className="mt-1">{experience.reservableEnLigne ? `${formatPrix(experience.prixCents)} / personne` : 'Sur devis'}</dd>
            </div>
          </dl>

          <p className="mt-8 whitespace-pre-line leading-relaxed text-stone-700">{experience.description}</p>
          <Galerie photos={experience.images} />
        </article>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          {experience.reservableEnLigne ? (
            <>
              <h2 className="font-serif text-2xl">Réserver</h2>
              <p className="mb-6 mt-1 text-sm text-stone-500">Paiement sécurisé par Stripe.</p>
              {utilisateur ? (
                <ReservationForm sessions={experience.sessions} utilisateur={utilisateur} />
              ) : (
                <div className="grid gap-3">
                  <ProchainesDates sessions={experience.sessions} className="mb-5" />
                  <p className="leading-relaxed text-stone-600">Un compte est nécessaire pour réserver : vous retrouverez ensuite vos réservations dans « Mon compte ».</p>
                  <Link href={`/connexion?retour=${retour}`} className={`text-center ${classeBouton}`}>Se connecter pour réserver</Link>
                  <Link href={`/inscription?retour=${retour}`} className="text-center text-sm underline">Créer un compte</Link>
                </div>
              )}
              {utilisateur && process.env.NODE_ENV !== 'production' && (
                <p className="mt-5 rounded-lg bg-stone-100 px-3 py-2 text-xs leading-relaxed text-stone-600">
                  Mode test : carte <strong>4242 4242 4242 4242</strong>, date d’expiration future, CVC au choix.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl">Sur devis</h2>
              <p className="mt-3 leading-relaxed text-stone-600">
                Cette expérience se prépare avec vous : date, groupe et programme sont définis ensemble.
              </p>
              <Link href={`/contact?experience=${experience.slug}`} className={`mt-6 flex justify-center ${classeBouton}`}>
                Demander un devis
              </Link>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
