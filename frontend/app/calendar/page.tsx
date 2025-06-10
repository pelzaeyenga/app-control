// app/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LogoHeader from '@/components/logo-header';
// Interface pour un contrôleur
interface Controleur {
  id: number;
  username: string;
  email: string;
  nom: string; 
  prenom: string;
  planning?: { id: number; date: string; document_count: number }[]; // Optionnel pour les planifications
}

// Interface pour un planning (optionnel, pour typage)
interface Planning {
  id: number;
  date: string;
  document_count: number;
}

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CalendarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  // Typage explicite de l'état controleurs
  const [controleurs, setControleurs] = useState<Controleur[]>([]);
  const [filteredControleurs, setFilteredControleurs] = useState<Controleur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const fetchControleurs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/calendar/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des contrôleurs');
        }

        // Typage explicite des données récupérées
        const data = await response.json() as Controleur[];
        setControleurs(data);

        const controleursWithPlanning = await Promise.all(
          data.map(async (controleur: Controleur) => {
            const planningResponse = await fetch(
              `http://localhost:8000/api/calendar/${controleur.id}/planning/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
              }
            );
            const planningData = await planningResponse.json() as Planning[];
            return { ...controleur, planning: planningData };
          })
        );

        const filtered = controleursWithPlanning.filter((controleur: Controleur) =>
          controleur.planning?.some((plan: Planning) => {
            const planDate = new Date(plan.date);
            return (
              planDate.getMonth() + 1 === selectedMonth.month &&
              planDate.getFullYear() === selectedMonth.year
            );
          })
        );
        setFilteredControleurs(filtered);
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des contrôleurs.');
      } finally {
        setLoading(false);
      }
    };

    fetchControleurs();
  }, [isAuthenticated, user, selectedMonth, router]);

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev.month === 1 ? 12 : prev.month - 1;
      const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev.month === 12 ? 1 : prev.month + 1;
      const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  };

  const handleControleurClick = (controleurId: number) => {
    router.push(`/calendar/${controleurId}`);
  };

  if (loading) {
    return <div className="text-center mt-10">Chargement...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  }

  return (
    <>
    <LogoHeader showLogout={true} />
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Contrôleurs sous votre supervision
        </h1>

        <div className="flex items-center justify-center mb-8">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            ←
          </button>
          <span className="mx-4 text-lg font-semibold text-blue-700">
            {months[selectedMonth.month - 1]} {selectedMonth.year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            →
          </button>
        </div>

        {filteredControleurs.length === 0 ? (
          <p className="text-center text-blue-600">
            Aucun contrôleur planifié pour ce mois.
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredControleurs.map((controleur: Controleur) => (
              <li
                key={controleur.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleControleurClick(controleur.id)}
              >
                <span className="text-blue-800 font-medium">{controleur.prenom} {controleur.nom}</span>
                
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </>
  );
}