'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false); 
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
       await login(email, password);
      } 
     catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">Connexion</h1>
          <p className="mt-2 text-blue-600">Veuillez saisir vos identifiants</p>
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-blue-300 bg-blue-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-blue-700">
                Se souvenir de moi
              </label>
            </div>

            <a href="#" className="text-sm font-medium text-blue-700 hover:underline">
              Mot de passe oublié?
            </a>
          </div>

          <div className="pt-2">
          <button
  type="submit"
  disabled={loading}
  className={`w-full rounded-lg px-5 py-2.5 text-center font-medium text-white shadow-md transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300
    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
  `}
>
  {loading ? 'Connexion...' : 'Se connecter'}
</button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-blue-600">
            Pas de compte ?{' '}
            <Link href="/register" className="font-medium text-blue-700 hover:underline">
              S’enregistrer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
