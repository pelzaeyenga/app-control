'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if ( !email || !password) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Envoi de la requête POST vers l'API
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          password2: confirmPassword,
          reset_password: true,
         
        
        }),
      });
  
      // Vérification de la réponse
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || 'Erreur lors de la création du compte');
        return;
      }



    alert('Compte créé avec succès. Veuillez vous connecter.');
    router.push('/login');
  } catch (error: any) {
    setError('Une erreur s\'est produite. Veuillez réessayer.');
    console.error(error);
  }  finally{
    setLoading(false);
  }
};






  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">Créer un compte</h1>
          <p className="mt-2 text-blue-600">Remplissez ces champs pour créer votre compte</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-center text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-blue-100 bg-white p-6 shadow-md">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-blue-700">
              Adresse mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="exemple@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-blue-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-blue-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
              disabled={loading} >
              {loading ? 'Chargement...' : 'S\'inscrire'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-blue-700">Vous avez déjà un compte? </span>
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


