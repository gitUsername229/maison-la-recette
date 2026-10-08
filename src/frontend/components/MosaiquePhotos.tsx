import Image from 'next/image';

export type PhotoMosaique = { url: string; alt: string };

/**
 * Mosaïque de la maquette (« Pour les entreprises ») : les photos deux par deux, la première de chaque rangée plus
 * large que la seconde (en alternance), la seconde allant jusqu'au bord. Photos : galeries des expériences.
 */
export default function MosaiquePhotos({ photos, className = '' }: { photos: PhotoMosaique[]; className?: string }) {
  const rangees = photos.flatMap((photo, i) => (i % 2 ? [] : [photos.slice(i, i + 2)]));
  return (
    <div className={`grid gap-2 ${className}`}>
      {rangees.map((rangee, r) => (
        <div key={rangee[0].url} className="flex h-36 gap-2 sm:h-52">
          {rangee.map((photo, i) => (
            <div key={photo.url} className={`relative overflow-hidden rounded-md ${i === 0 && rangee.length > 1 ? (r % 2 ? 'w-[52%]' : 'w-[69%]') : 'flex-1'}`}>
              <Image src={photo.url} alt={photo.alt} fill sizes="(min-width: 1024px) 35vw, 70vw" className="object-cover" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
