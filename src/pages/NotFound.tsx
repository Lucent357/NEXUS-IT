import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}