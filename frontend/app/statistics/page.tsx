"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts"
import { ArrowLeft, Download } from "lucide-react"
import LogoHeader from "@/components/logo-header"
import ProtectedRoute from "@/components/protected-route"

// Sample data for statistics
const monthlyData = [
  { name: 'Jan', controls: 45, completed: 40 },
  { name: 'Fév', controls: 50, completed: 42 },
  { name: 'Mar', controls: 35, completed: 30 },
  { name: 'Avr', controls: 60, completed: 55 },
  { name: 'Mai', controls: 48, completed: 45 },
  { name: 'Jun', controls: 52, completed: 50 },
]

const statusData = [
  { name: 'Terminés', value: 262, color: '#22c55e' },
  { name: 'En cours', value: 45, color: '#eab308' },
  { name: 'Annulés', value: 28, color: '#ef4444' },
]

export default function StatisticsPage() {
  return (
    <ProtectedRoute>
      <StatisticsContent />
    </ProtectedRoute>
  )
}

function StatisticsContent() {
  const router = useRouter()
  const [timeFrame, setTimeFrame] = useState<'month' | 'year'>('month')

  const handleExport = () => {
    alert('Export fonctionnalité à implémenter')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LogoHeader showLogout={true} />
      
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/')}
              className="mr-4 rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-blue-800">
              Statistiques
            </h1>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Download className="mr-2 h-5 w-5" />
            Exporter
          </button>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <button
            onClick={() => setTimeFrame('month')}
            className={`rounded-lg px-4 py-2 ${
              timeFrame === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            Dernier mois
          </button>
          
          <button
            onClick={() => setTimeFrame('year')}
            className={`rounded-lg px-4 py-2 ${
              timeFrame === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            Année en cours
          </button>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Controls Chart */}
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-800">Contrôles par mois</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="controls" name="Contrôles prévus" fill="#3b82f6" />
                  <Bar dataKey="completed" name="Contrôles effectués" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Status Distribution Chart */}
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-800">Statut des contrôles</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Nombre']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-800">Résumé</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-600">Total des contrôles</p>
                <p className="text-2xl font-bold text-blue-800">335</p>
              </div>
              
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Taux de complétion</p>
                <p className="text-2xl font-bold text-green-800">78%</p>
              </div>
              
              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-sm text-yellow-600">Délai moyen</p>
                <p className="text-2xl font-bold text-yellow-800">3.2 jours</p>
              </div>
              
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-purple-600">Inspecteurs actifs</p>
                <p className="text-2xl font-bold text-purple-800">12</p>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-800">Activité récente</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg bg-gray-50 p-3">
                  <p className="font-medium text-blue-800">Contrôle #{335 - i}</p>
                  <p className="text-sm text-gray-600">
                    Entreprise ABC - {i === 1 ? 'Aujourd\'hui' : `Il y a ${i} jours`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
