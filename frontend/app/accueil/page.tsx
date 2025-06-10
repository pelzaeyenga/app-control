import Link from "next/link"
import { UserPlus, UserMinus, LogOut } from "lucide-react"

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative mb-8 rounded-lg bg-white p-6 shadow-md">
          <Link href="/" className="absolute right-6 top-6 flex items-center text-blue-600 hover:text-blue-800">
            <LogOut className="mr-1 h-4 w-4" />
            <span>Se déconnecter</span>
          </Link>

          <h1 className="text-2xl font-bold text-blue-800">Bienvenue, Administrateur</h1>
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-blue-700">Que désirez-vous faire ?</h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/ajouter_utilisateur"
                className="flex flex-col items-center rounded-lg border border-blue-100 bg-white p-6 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <UserPlus className="mb-4 h-12 w-12 text-blue-600" />
                <span className="text-lg font-medium text-blue-800">Ajouter un utilisateur</span>
              </Link>

              <Link
                href="/supprimer_utilisateur"
                className="flex flex-col items-center rounded-lg border border-blue-100 bg-white p-6 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <UserMinus className="mb-4 h-12 w-12 text-blue-600" />
                <span className="text-lg font-medium text-blue-800">Supprimer un utilisateur</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
