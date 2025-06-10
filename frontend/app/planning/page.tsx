"use client"
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LogoHeader from '@/components/logo-header';

// Interface pour la planification
interface Planification {
  id: number;
  date: string;
  controleur_id: number;
  employeur_id: number;
}

export default function Calendar() {
  const router = useRouter();
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [planifications, setPlanifications] = useState<Planification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchPlanifications = async () => {
    try {
      // Récupération du token depuis localStorage
      const token = localStorage.getItem('accessToken');
      
      // Vérification si le token existe
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('http://localhost:8000/api/planifications/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Assurez-vous qu'il y a un espace après "Bearer"
        }
      });

      // Gestion spécifique des erreurs d'authentification
      if (response.status === 401) {
        // Le token est peut-être expiré, tentez de le rafraîchir
        await refreshToken();
        // Réessayez avec le nouveau token
        return fetchPlanifications();
      }

      if (!response.ok) {
        throw new Error(`Échec de la récupération des planifications: ${response.status}`);
      }

      const data: Planification[] = await response.json();
      console.log("Planifications récupérées:", data);
      setPlanifications(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError('Impossible de charger les planifications');
      setIsLoading(false);
    }
  };

  // Fonction pour rafraîchir le token si nécessaire
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('Refresh token manquant');
      }
      
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Échec du rafraîchissement du token');
      }
      
      const data = await response.json();
      
      // Sauvegarde du nouveau token
      localStorage.setItem('accessToken', data.access);
      
      return data.access;
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      // Rediriger vers la page de connexion
      window.location.href = '/login';
      throw error;
    }
  };

  fetchPlanifications();
}, []);
  
  const getCurrentMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const daysArray = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  };
  
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
 const isControlDay = (day: number | null) => {
  if (day === null) return false;
  
  // Format de date YYYY-MM-DD pour comparaison
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return planifications.some((plan) => {
    // Extraire seulement la partie date (YYYY-MM-DD) de la date du plan
    const planDateString = plan.date.split('T')[0];
    return planDateString === formattedDate;
  });
};

  // Fonction pour obtenir les planifications pour un jour donné
  const getPlanificationsForDay = (day: number | null) => {
    if (day === null) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return planifications.filter((plan) => {
      const planDateString = plan.date.split('T')[0];
      return planDateString === formattedDate;
    });
  };

 // Fonction pour naviguer vers la page Documents
const handleDayClick = (day: number | null) => {
  if (day === null) return; // Ne rien faire si le jour est null

  const planificationsOfDay = getPlanificationsForDay(day);
  console.log("Planifications pour le jour", day, ":", planificationsOfDay); // Log pour déboguer

  // Puisqu'un jour a au maximum une planification, on prend l'ID de la première (s'il y en a une)
  if (planificationsOfDay.length === 1) {
    const id = planificationsOfDay[0].id; // Renommé de planificationId à id pour plus de clarté
    console.log("Redirection vers /documents/", id); // Log pour confirmer
    router.push(`/documents/${id}`); // Utilisation de id pour la redirection
  }
};

const isWeekend = (index: number, day: number | null) => {
  if (day === null) return false;

  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  const dayOfWeek = date.getDay();

  return dayOfWeek === 0 || dayOfWeek === 6;
};

if (isLoading) return <div>Chargement...</div>;
if (error) return <div>Erreur : {error}</div>;

return (
   <>
   <LogoHeader showLogout={true} />
  <div className="flex h-screen">
    {/* Sidebar */}
    <div className="w-64 bg-blue-50 p-4 flex flex-col">
      <div className="text-xl font-bold text-blue-800 mb-4">Planning</div>

      {months.map((month, index) => (
        <div
          key={index}
          className={`py-2 px-4 my-1 rounded ${
            currentDate.getMonth() === index ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-100'
          }`}
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), index, 1))}
        >
          {month}
        </div>
      ))}
    </div>

    {/* Main content */}
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          className="p-2 rounded-full bg-blue-50 text-blue-500"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft size={24} />
        </button>

        <h1 className="text-2xl font-bold text-blue-800">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h1>

        <button
          className="p-2 rounded-full bg-blue-50 text-blue-500"
          onClick={handleNextMonth}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => (
          <div key={index} className="text-center font-medium text-blue-800">
            {day}
          </div>
        ))}

        {getCurrentMonthDays(currentDate).map((day, index) => {
          const isPlanned = isControlDay(day);
          const dayPlanifications = day !== null ? getPlanificationsForDay(day) : [];

          // Classe de base pour tous les jours valides (non null)
          let bgClass = '';
          let borderClass = '';
          let cursorClass = '';

          if (day !== null) {
            if (isPlanned) {
              bgClass = 'bg-yellow-200';
              borderClass = 'border-yellow-400';
              cursorClass = 'cursor-pointer hover:bg-yellow-300';
            } else {
              bgClass = ''; // pas de fond particulier
              borderClass = 'border-gray-200'; // bordure par défaut
              cursorClass = '';
            }
          }

          return (
            <div
              key={`day-${index}`}
              className={`
                h-14 flex flex-col items-center justify-center relative
                ${day !== null ? `border rounded ${bgClass} ${borderClass} ${cursorClass}` : ''}
              `}
              onClick={() => handleDayClick(day)}
            >
              <span>{day || ''}</span>
              {isPlanned && (
                <div className="absolute top-1 right-1 flex items-center">
                  <span className="text-xs text-yellow-400">1</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
  </>
);
}