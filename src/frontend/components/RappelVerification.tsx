'use client';

import { useState } from 'react';
import { authClient } from '@/frontend/auth-client';

type Props = { email: string; lienExpire: boolean };

/** Bandeau de /compte tant que l'adresse n'est pas vérifiée (la vérification n'est pas bloquante). */
export default function RappelVerification({ email, lienExpire }: Props) {
  const [etat, setEtat] = useState<'attente' | 'envoi' | 'envoye' | 'erreur'>('attente');

  async function renvoyer() {
    setEtat('envoi');
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: '/compte' });
    setEtat(error ? 'erreur' : 'envoye');
  }

  return (
    <div role="status" className="mt-6 rounded-xl bg-pastel-chaud p-4 text-sm leading-relaxed text-accent ring-1 ring-pastel-chaud">
      <p>
        {lienExpire ? 'Ce lien de vérification n’est plus valable.' : 'Votre adresse e-mail n’est pas encore vérifiée.'}{' '}
        Confirmez-la pour être sûr de recevoir vos confirmations de réservation.
      </p>
      {etat === 'envoye' ? (
        <p className="mt-2 font-medium">E-mail envoyé à {email} : cliquez sur le lien qu’il contient.</p>
      ) : (
        <button type="button" onClick={renvoyer} disabled={etat === 'envoi'} className="mt-2 font-medium underline">
          {etat === 'envoi' ? 'Envoi…' : 'Renvoyer l’e-mail de vérification'}
        </button>
      )}
      {etat === 'erreur' && <p className="mt-2 text-erreur">L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.</p>}
    </div>
  );
}
