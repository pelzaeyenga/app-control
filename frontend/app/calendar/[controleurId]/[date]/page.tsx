// app/calendar/[controleurId]/[date]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LogoHeader from '@/components/logo-header';

interface Document {
  id: number;
  url: string;
  uploaded_at: string;
}

interface SummaryReport {
  id: number;
  report_url: string;
  created_at: string; // Remplacé generated_at par created_at
}

interface Controleur {
  id: number;
  nom: string;
  prenom: string;
}

interface DocumentListResponse {
  entreprise_name: string;
  documents: Document[];
  summary_report: SummaryReport | null;
}

export default function DocumentsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { controleurId, date } = useParams();
  const [data, setData] = useState<DocumentListResponse | null>(null);
  const [controleur, setControleur] = useState<Controleur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user || !controleurId || !date) {
      router.push('/login');
      return;
    }

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');

        // Récupérer les documents, l'entreprise et le rapport final
        const documentsResponse = await fetch(
          `http://localhost:8000/api/calendar/${controleurId}/documents/?date=${date}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          }
        );

        if (!documentsResponse.ok) {
          const errorText = await documentsResponse.text();
          throw new Error(`Erreur HTTP ${documentsResponse.status}: ${errorText}`);
        }

        const documentsData = await documentsResponse.json() as DocumentListResponse;
        setData(documentsData);

        // Récupérer les infos du contrôleur
        const controleursResponse = await fetch('http://localhost:8000/api/calendar/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!controleursResponse.ok) {
          const errorText = await controleursResponse.text();
          throw new Error(`Erreur HTTP ${controleursResponse.status}: ${errorText}`);
        }

        const controleursData = await controleursResponse.json() as Controleur[];
        const controleur = controleursData.find((c) => c.id === parseInt(controleurId as string));
        setControleur(controleur || null);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Une erreur est survenue: ${err.message}`);
        } else {
          setError('Une erreur inconnue est survenue.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, user, controleurId, date, router]);

  const handleBack = () => {
    router.push(`/calendar/${controleurId}`);
  };

  const handleDownload = async (documentId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/download/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Erreur lors du téléchargement: ${err.message}`);
      } else {
        setError('Erreur inconnue lors du téléchargement.');
      }
    }
  };

  const handleReportDownload = async (reportId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8000/api/summary-reports/${reportId}/download/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'summary_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Erreur lors du téléchargement du rapport: ${err.message}`);
      } else {
        setError('Erreur inconnue lors du téléchargement du rapport.');
      }
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      return url.split('/').pop() || 'Document inconnu';
    } catch {
      return 'Document inconnu';
    }
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
        <button
          onClick={handleBack}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Retour au calendrier
        </button>

        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Documents pour {controleur ? `${controleur.prenom} ${controleur.nom}` : 'Contrôleur inconnu'} - {date}
        </h1>

        {data && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Documents Uploadés</h2>
              {data.documents.length === 0 ? (
                <p className="text-center text-gray-600">Aucun document uploadé pour ce jour.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border px-4 py-2 text-left">Entreprise Contrôlée</th>
                      <th className="border px-4 py-2 text-left">Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{data.entreprise_name}</td>
                        <td className="border px-4 py-2">
                          <div className="flex justify-between items-center">
                            <span>
                              {getFileNameFromUrl(doc.url)} (Uploadé le{' '}
                              {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')})
                            </span>
                            <button
                              onClick={() => handleDownload(doc.id)}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Télécharger
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {data.summary_report && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">Rapport Final</h2>
                <div className="flex justify-between items-center">
                  <span>
                    Rapport final (Généré le{' '}
                    {new Date(data.summary_report.created_at).toLocaleDateString('fr-FR')})  {/* Remplacé generated_at par created_at */}
                  </span>
                  <button
                    onClick={() => data.summary_report && handleReportDownload(data.summary_report.id)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Télécharger
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}