import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
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

export default function Experience({ experience }: { experience: ExperienceDetail }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-6 lg:py-12">
      <Link href="/experiences" className="text-sm text-texte-doux hover:text-texte">← Toutes les expériences</Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <article>
          <p className="w-fit rounded-full bg-pastel px-3 py-1 text-xs font-semibold uppercase tracking-wider">{libelleType(experience.type)}</p>
          <h1 className="mt-3 text-3xl font-bold lg:text-4xl">{experience.titre}</h1>
          <p className="mt-5 text-lg leading-relaxed">{experience.accroche}</p>
          {experience.image && <Image src={experience.image} alt={experience.imageAlt} width={1200} height={750} priority className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover" />}

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-bordure-forte pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-texte-doux">Durée</dt>
              <dd className="mt-1">{formatDuree(experience.dureeMin)}</dd>
            </div>
            <div>
              <dt className="text-texte-doux">Lieu</dt>
              <dd className="mt-1">{experience.lieu ?? 'Précisé à la réservation'}</dd>
            </div>
            <div>
              <dt className="text-texte-doux">Tarif</dt>
              <dd className="mt-1">{experience.reservableEnLigne ? `${formatPrix(experience.prixCents)} / personne` : 'Sur devis'}</dd>
            </div>
          </dl>

          <p className="mt-8 whitespace-pre-line leading-relaxed text-texte-doux">{experience.description}</p>
          <Galerie photos={experience.images} />
        </article>

        <aside id="reserver" className="h-fit scroll-mt-24 rounded-xl bg-fond-doux p-6">
          {experience.reservableEnLigne ? (
            <>
              <h2 className="font-serif text-2xl">Réserver</h2>
              <p className="mb-6 mt-1 text-sm text-texte-doux">Paiement sécurisé par Stripe.</p>
              <ReservationForm sessions={experience.sessions} />
              {process.env.NODE_ENV !== 'production' && (
                <p className="mt-5 rounded-lg bg-fond px-3 py-2 text-sm leading-relaxed text-texte-doux">
                  Mode test : carte <strong>4242 4242 4242 4242</strong>, date d’expiration future, CVC au choix.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl">Sur devis</h2>
              <p className="mt-3 leading-relaxed text-texte-doux">
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
