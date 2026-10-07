/** Feuille de salade stylisée, en écho au logo du podcast (décorative ; couleur : celle du texte autour). */
export default function Feuille({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1.5C6.2 5.4 3.6 10.6 5.4 16.4 6.8 20.6 12 22.5 12 22.5s5.2-1.9 6.6-6.1c1.8-5.8-.8-11-6.6-14.9Z" />
      <path className="stroke-fond" fill="none" strokeWidth="1.4" strokeLinecap="round" d="M12 6.5v14M12 11l-3.2-2.4M12 11l3.2-2.4M12 15.5l-3.6-2.6M12 15.5l3.6-2.6" />
    </svg>
  );
}
