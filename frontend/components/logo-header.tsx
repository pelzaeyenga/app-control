'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface LogoHeaderProps {
  showLogout?: boolean; 
}

export default function LogoHeader({ showLogout = false }: LogoHeaderProps) {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout(); 
  };

  return (
    <div className="flex items-center justify-between bg-blue-800 px-4 py-2 shadow-md">
      <Link href="/" className="flex items-center">
        {/* Logo fallback qui ne dépend pas d'une image externe */}
        <div className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <span className="text-lg font-bold">C</span>
        </div>
        <span className="text-xl font-bold text-white">CNPS Control</span>
      </Link>

      <div className="flex items-center">
        {user ? (
          showLogout && (
            <div className="flex items-center">
              <span className="mr-4 text-sm text-white">
                {user.name || 'Utilisateur'} ({user.role || 'Rôle inconnu'})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-blue-700 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
              >
                Déconnexion
              </button>
            </div>
          )
        ) : (
          <Link href="/login" className="text-sm font-medium text-white hover:text-blue-200">
            Connexion
          </Link>
        )}
      </div>
    </div>
  );
}