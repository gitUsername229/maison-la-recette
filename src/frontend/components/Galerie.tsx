import Image from 'next/image';

export type PhotoGalerie = { id: number; url: string; alt: string };

/** Galerie photos d'une page, gérée dans /admin/photos. Rien n'est affiché tant qu'il n'y a pas de photo. */
export default function Galerie({ photos, titre = 'En images' }: { photos: PhotoGalerie[]; titre?: string }) {
  if (photos.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold text-titre">{titre}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(photo => (
          <li key={photo.id}>
            <Image src={photo.url} alt={photo.alt} width={600} height={450} sizes="(min-width: 640px) 33vw, 50vw" className="aspect-[4/3] w-full rounded-2xl object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}
