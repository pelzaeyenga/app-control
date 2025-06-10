'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LogoHeader from '@/components/logo-header';

interface Planning {
  id: number;
  date: string;
  document_count: number;
}

interface Controleur {
  id: number;
  nom: string;
  prenom: string;
}

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function PlanningPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { controleurId } = useParams();
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
 const [controleur, setControleur] = useState<Controleur | null>(null); // Utiliser controleur comme état

  useEffect(() => {
    if (!isAuthenticated || !user || !controleurId) {
      router.push('/login');
      return;
    }

    const fetchPlanning = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');

        const planningResponse = await fetch(
          `http://localhost:8000/api/calendar/${controleurId}/planning/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          }
        );

        if (!planningResponse.ok) {
          throw new Error('Erreur lors de la récupération des planifications');
        }

        const planningData = await planningResponse.json() as Planning[];
        setPlanning(planningData);

        const controleursResponse = await fetch('http://localhost:8000/api/calendar/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!controleursResponse.ok) {
          throw new Error('Erreur lors de la récupération des contrôleurs');
        }

        const controleursData = await controleursResponse.json() as Controleur[];
        console.log("Controleurs data:", controleursData);

        const controleur = controleursData.find((c) => c.id === parseInt(controleurId as string));
        if (controleur) {
          console.log("Controleur found:", controleur);
          setControleur(controleur);
        }
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanning();
  }, [isAuthenticated, user, controleurId, router]);

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

  const handleBackToList = () => {
    router.push('/calendar');
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return; 
    // Construire la date au format YYYY-MM-DD
    const formattedDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Rediriger vers la page des documents
    router.push(`/calendar/${controleurId}/${formattedDate}`);
  };

  const getDaysInMonth = (month: number, year: number) => {
    const days = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const calendarDays = [];

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      calendarDays.push(null);
    }

    for (let day = 1; day <= days; day++) {
      calendarDays.push(day);
    }

    return calendarDays;
  };

  const daysInMonth = getDaysInMonth(selectedMonth.month, selectedMonth.year);
  const plannedDays = planning.map((plan) => {
    const planDate = new Date(plan.date);
    if (
      planDate.getMonth() + 1 === selectedMonth.month &&
      planDate.getFullYear() === selectedMonth.year
    ) {
      return planDate.getDate();
    }
    return null;
  }).filter((day) => day !== null);

  const workedDays = planning
    .filter((plan) => plan.document_count > 0)
    .map((plan) => {
      const planDate = new Date(plan.date);
      if (
        planDate.getMonth() + 1 === selectedMonth.month &&
        planDate.getFullYear() === selectedMonth.year
      ) {
        return planDate.getDate();
      }
      return null;
    })
    .filter((day) => day !== null);

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
        <button
          onClick={handleBackToList}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Retour à la liste
        </button>

        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          {controleur ? `${controleur.prenom} ${controleur.nom}` : 'Contrôleur inconnu'}
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

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-7 gap-2 text-center text-blue-700 font-medium">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {daysInMonth.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  p-2 rounded-full text-center cursor-default
                  ${day ? 'bg-white hover:bg-gray-100' : 'text-gray-300'}
                  ${day && workedDays.includes(day) ? 'bg-green-200' : ''}
                  ${day && plannedDays.includes(day) && !workedDays.includes(day) ? 'bg-yellow-200' : ''}
                `}
              >
                {day || ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}