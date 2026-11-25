import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}

export default function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}