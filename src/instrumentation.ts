// Exécuté une fois au démarrage du serveur Next.js (next dev / next start), avant toute requête.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Limite d'envois par IP : sans proxy configuré, l'en-tête x-forwarded-for du visiteur n'est pas cru.
    const { ignorerEntetesIpDuVisiteur } = await import('@/backend/adresse-ip');
    ignorerEntetesIpDuVisiteur();
  }
}
