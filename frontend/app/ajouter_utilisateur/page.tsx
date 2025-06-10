"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import LogoHeader from "@/components/logo-header"

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    role: "Superviseur",
    center: "", // Added center field
  })

  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your API
    console.log("Form submitted:", formData)

    // Show success message
    setShowSuccess(true)

    // Reset form after 2 seconds
    setTimeout(() => {
      setFormData({
        lastName: "",
        firstName: "",
        email: "",
        role: "Superviseur",
        center: "",
      })
      setShowSuccess(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <LogoHeader showLogout={true} logoutLink="/" />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link href="/accueil" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-blue-800">Ajouter un utilisateur</h1>

          {showSuccess && (
            <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">Utilisateur ajouté avec succès !</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-blue-700">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-blue-700">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-blue-700">
                Adresse mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="center" className="mb-1 block text-sm font-medium text-blue-700">
                Centre
              </label>
              <input
                id="center"
                name="center"
                type="text"
                value={formData.center}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-blue-700">
                Rôle
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 p-2.5 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="Superviseur">Superviseur</option>
                <option value="Contrôleur">Contrôleur</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Terminé
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
