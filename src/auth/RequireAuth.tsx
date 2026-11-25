import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function RequireAuth() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Memuat...
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-slate-700">Akun Anda belum memiliki profil. Hubungi administrator.</p>
        <button
          onClick={signOut}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    )
  }

  return <Outlet />
}