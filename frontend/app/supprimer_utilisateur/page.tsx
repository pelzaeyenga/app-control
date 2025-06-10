"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, X, LogOut } from "lucide-react"

export default function DeleteUserPage() {
  // Sample user data
  const [users, setUsers] = useState([
    { id: 1, name: "Dupont Jean" },
    { id: 2, name: "Martin Sophie" },
    { id: 3, name: "Bernard Thomas" },
    { id: 4, name: "Petit Marie" },
    { id: 5, name: "Durand Pierre" },
  ])

  const [showModal, setShowModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null)

  const openDeleteModal = (user: { id: number; name: string }) => {
    setUserToDelete(user)
    setShowModal(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id))
      setShowModal(false)
      setUserToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowModal(false)
    setUserToDelete(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/accueil" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Link>

          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <LogOut className="mr-1 h-4 w-4" />
            <span>Se déconnecter</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-blue-800">Supprimer un utilisateur</h1>

          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border-b border-blue-200 px-6 py-3 text-left font-semibold text-blue-800">Noms</th>
                    <th className="border-b border-blue-200 px-6 py-3 text-center font-semibold text-blue-800">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="px-6 py-4 text-blue-700">{user.name}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-700">Aucun utilisateur disponible</div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-blue-800">Confirmation</h3>
            <p className="mb-6 text-blue-700">
              Voulez-vous vraiment supprimer cet utilisateur ?
              <span className="mt-2 block font-medium">{userToDelete?.name}</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 font-medium text-blue-600 hover:bg-blue-50"
              >
                Non
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
