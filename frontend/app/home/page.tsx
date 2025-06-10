"use client"

import React from 'react';
import { useRouter } from 'next/navigation';

const WelcomePage = () => {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-blue-800">
          Bienvenue
        </h1>
        
        <p className="text-center text-gray-600">
          Veuillez vous connecter ou créer un compte
        </p>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleRegister}
            className="w-full px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            S'enregistrer
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;