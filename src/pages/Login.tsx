import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Server } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import Field from '../components/FormField'
import { inputClass } from '../lib/styles'

const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setSubmitting(true)
    const message = await signIn(email.trim(), password)
    setSubmitting(false)
    if (message) setError(message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <Server className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NEXUS IT</h1>
          <p className="mt-1 text-sm text-slate-500">IT Asset Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <Field label="Email">
            <input
              type="email"
              autoComplete="username"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        {demoEmail && demoPassword && (
          <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm">
            <p className="font-medium text-indigo-900">Akun demo</p>
            <p className="mt-1 text-indigo-800">
              Silakan coba semua fitur. Perubahan tidak akan disimpan.
            </p>
            <dl className="mt-3 space-y-1 text-indigo-900">
              <div className="flex gap-2">
                <dt className="w-16 text-indigo-700">Email</dt>
                <dd className="font-mono text-xs">{demoEmail}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 text-indigo-700">Password</dt>
                <dd className="font-mono text-xs">{demoPassword}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setEmail(demoEmail)
                setPassword(demoPassword)
              }}
              className="mt-3 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Isi otomatis
            </button>
          </div>
        )}
      </div>
    </div>
  )
}