// Formats français partagés par les pages serveur et les composants client.

export const formatPrix = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/** 150 → « 2 h 30 », 180 → « 3 h », 45 → « 45 min » */
export function formatDuree(minutes: number) {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (!heures) return `${reste} min`;
  return reste ? `${heures} h ${String(reste).padStart(2, '0')}` : `${heures} h`;
}

const libelles: Record<string, string> = { atelier: 'Atelier', good_tour: 'Good tour', immersion: 'Immersion' };

export const libelleType = (type: string) => libelles[type] ?? type;
