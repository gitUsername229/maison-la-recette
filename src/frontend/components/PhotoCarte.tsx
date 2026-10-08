import Image from 'next/image';

type Props = { src: string; alt: string; sizes: string; ratio?: string };

/**
 * Photo en haut d'une carte cliquable (élément parent `group`, qui arrondit les angles) : léger zoom au survol, le
 * seul effet animé du site. Il disparaît si l'utilisateur réduit les animations (motion-safe, et la règle de globals.css).
 */
export default function PhotoCarte({ src, alt, sizes, ratio = 'aspect-[3/2]' }: Props) {
  return (
    <div className={`overflow-hidden ${ratio}`}>
      <Image src={src} alt={alt} width={800} height={600} sizes={sizes} className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
    </div>
  );
}
