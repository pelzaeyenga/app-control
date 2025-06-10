"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import axios from "axios";
import LogoHeader from "@/components/logo-header";

interface Planification {
  id: number;
  date: string;
  controleur: {
    id: number;
    email: string;
  };
  employeur: {
    id: number;
    nom: string;
    adresse: string;
  };
}

export default function DocumentsTable() {
  const params = useParams();
  const { id } = params as { id: string };
  const [planification, setPlanification] = useState<Planification | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPlanification = async () => {
      const token = localStorage.getItem('accessToken');
      console.log("Token envoyé:", token);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log("En-têtes envoyés:", headers);
      try {
        
        const response = await axios.get(`http://localhost:8000/api/planifications/${id}/`, {
    headers: headers,
  });
        console.log("Réponse de l'API:", response.data);
        setPlanification(response.data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors de la récupération des détails de la planification.");
        setLoading(false);
      }
    };
    fetchPlanification();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
  if (files.length === 0) {
    alert("Veuillez sélectionner au moins un fichier.");
    return;
  }

  const token = localStorage.getItem('accessToken');
  console.log("Token envoyé pour upload:", token);

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`file-${index}`, file); // Utilise 'files' au lieu de `file-${index}`
  });
  formData.append("planification_id", id);

  try {
    const response = await axios.post("http://localhost:8000/api/upload-documents/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`, // Ajoute l'en-tête Authorization
      },
    });
    console.log("Réponse de l'upload:", response.data);
    alert("Documents téléchargés avec succès !");
    setFiles([]);
  } catch (err: any) {
    console.error("Erreur lors de l'upload:", err.response?.data || err.message);
    alert(`Erreur lors du téléversement des documents: ${err.response?.data?.error || err.message}`);
  }
};

  if (loading) return <div className="min-h-screen bg-white p-6">Chargement...</div>;
  if (error) return <div className="min-h-screen bg-white p-6">{error}</div>;
  if (!planification) return <div className="min-h-screen bg-white p-6">Aucune planification trouvée.</div>;

  return (
    <>
    <LogoHeader showLogout={true} />
    <div className="min-h-screen bg-white p-6">
      <h1 className="mb-6 text-2xl font-bold text-blue-800">Documents à fournir</h1>

      <div className="overflow-x-auto rounded-lg border border-blue-100 shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border-b border-blue-200 px-6 py-3 text-left font-semibold text-blue-800">Employeur</th>
              <th className="border-b border-blue-200 px-6 py-3 text-left font-semibold text-blue-800">Adresse</th>
              <th className="border-b border-blue-200 px-6 py-3 text-left font-semibold text-blue-800">
                Pièces à fournir
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-blue-100 px-6 py-4 text-blue-700">
                {planification.employeur.nom || "Nom non disponible"}
              </td>
              <td className="border-b border-blue-100 px-6 py-4 text-blue-700">
                {planification.employeur.adresse || "Adresse non disponible"}
              </td>
              <td className="border-b border-blue-100 px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    {files.length > 0 ? (
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-blue-700">{file.name}</span>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="ml-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-blue-700">Téléversez vos pièces ici</span>
                    )}
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <label className="flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Parcourir</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    {files.length > 0 && (
                      <button
                        onClick={handleUpload}
                        className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                      >
                        Téléverser
                      </button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        onClick={() => window.history.back()}
        className="mt-6 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
      >
        Retour au planning
      </button>
    </div>
    </>
  );
}