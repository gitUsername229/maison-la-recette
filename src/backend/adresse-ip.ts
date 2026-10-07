import { Server, type IncomingMessage } from 'node:http';

// Adresse IP du visiteur, pour la limite d'envois des formulaires publics (src/backend/anti-spam.ts).
// Pas de « server-only » : ce module est aussi chargé au démarrage du serveur (src/instrumentation.ts).

/** Nombre de proxys de confiance devant le site (PROXY_DE_CONFIANCE, ex : 1 derrière nginx) ; 0 par défaut. */
export function proxysDeConfiance(): number {
  const nombre = Number(process.env.PROXY_DE_CONFIANCE ?? 0);
  return Number.isInteger(nombre) && nombre > 0 ? nombre : 0;
}

/**
 * Adresse IP du visiteur, lue dans x-forwarded-for. Chaque proxy ajoute à la fin de cet en-tête l'adresse
 * qui s'est connectée à lui : derrière N proxys de confiance, celle du visiteur est la N-ième en partant de
 * la fin, et ce qui précède (écrit par le visiteur lui-même) est ignoré. Sans proxy, l'en-tête envoyé par
 * le visiteur est retiré au démarrage (ignorerEntetesIpDuVisiteur) : il ne contient que l'IP de connexion.
 */
export function adresseIp(entetes: Headers): string {
  const adresses = (entetes.get('x-forwarded-for') ?? '').split(',').map(a => a.trim()).filter(Boolean);
  return adresses.at(-Math.max(1, proxysDeConfiance())) ?? adresses[0] ?? 'inconnue';
}

const DEJA_INSTALLE = Symbol.for('maison-la-recette.entetes-ip-ignores');

/**
 * Sans proxy de confiance, retire des requêtes reçues les en-têtes d'adresse IP envoyés par le visiteur
 * (x-forwarded-for, x-real-ip) : Next.js écrit alors lui-même l'IP de connexion dans x-forwarded-for,
 * ce qu'il ne fait que si l'en-tête est absent. Appelé une fois, au démarrage du serveur Node.js.
 */
export function ignorerEntetesIpDuVisiteur() {
  const prototype = Server.prototype as Server & { [DEJA_INSTALLE]?: boolean };
  if (proxysDeConfiance() > 0 || prototype[DEJA_INSTALLE]) return;
  const emettre = prototype.emit;
  prototype.emit = function (this: Server, evenement: string | symbol, ...args: unknown[]) {
    if (evenement === 'request') {
      const { headers } = args[0] as IncomingMessage;
      delete headers['x-forwarded-for'];
      delete headers['x-real-ip'];
    }
    return Reflect.apply(emettre, this, [evenement, ...args]) as boolean;
  } as typeof emettre;
  prototype[DEJA_INSTALLE] = true;
}
