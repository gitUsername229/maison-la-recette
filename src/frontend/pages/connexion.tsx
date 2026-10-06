'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {authClient, messageErreurAuth} from '@/frontend/auth-client';
import Champ from '@/frontend/components/Champ';
import {classeBouton, classeErreur} from '@/frontend/styles/classes';

export default function Connexion({retour}: { retour: string }) {
    const router = useRouter();
    const [erreur, setErreur] = useState<string | null>(null);
    const [envoi, setEnvoi] = useState(false);

    async function connecter(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const donnees = new FormData(event.currentTarget);
        setErreur(null);
        setEnvoi(true);
        const {error} = await authClient.signIn.email({
            email: String(donnees.get('email')),
            password: String(donnees.get('motDePasse')),
        });
        if (error) {
            setErreur(messageErreurAuth(error));
            setEnvoi(false);
            return;
        }
        router.replace(retour);
        router.refresh();
    }

    return (
        <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
            <h1 className="font-serif text-4xl">Connexion</h1>
            <p className="mt-3 leading-relaxed text-stone-600">Un compte est nécessaire pour réserver une expérience ou
                demander un devis.</p>
            <form onSubmit={connecter} className="mt-8 grid gap-4">
                <Champ libelle="E-mail" name="email" type="email" autoComplete="email" required/>
                <Champ libelle="Mot de passe" name="motDePasse" type="password" autoComplete="current-password"
                       required/>
                {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
                <button type="submit" disabled={envoi}
                        className={classeBouton}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
            </form>
            <p className="mt-6 text-sm text-stone-600">
                Pas encore de compte ? <Link href={`/inscription?retour=${encodeURIComponent(retour)}`}
                                             className="underline">Créer un compte</Link>
            </p>
        </main>
    );
}
