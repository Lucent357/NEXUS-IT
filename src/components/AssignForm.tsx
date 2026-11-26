import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { DEMO_MESSAGE } from '../auth/demo'
import Field from './FormField'
import FormError from './FormError'
import { inputClass } from '../lib/styles'
import { todayISO } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { AssetOption, EmployeeOption } from '../types/database'

type AssignFormProps = {
  assets: AssetOption[]
  employees: EmployeeOption[]
  onSaved: () => void
  onCancel: () => void
}

type FormState = {
  asset_id: string
  employee_id: string
  assigned_at: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!values.asset_id) errors.asset_id = 'Pilih aset.'
  if (!values.employee_id) errors.employee_id = 'Pilih karyawan.'

  if (!values.assigned_at) {
    errors.assigned_at = 'Tanggal penyerahan wajib diisi.'
  } else if (values.assigned_at > todayISO()) {
    errors.assigned_at = 'Tanggal penyerahan tidak boleh di masa depan.'
  }

  return errors
}

export default function AssignForm({
  assets,
  employees,
  onSaved,
  onCancel,
}: AssignFormProps) {
  const { isDemo } = useAuth()
  const [values, setValues] = useState<FormState>({
    asset_id: '',
    employee_id: '',
    assigned_at: todayISO(),
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (isDemo) {
      setSubmitError(DEMO_MESSAGE)
      return
    }

    setSaving(true)
    const { error } = await supabase.rpc('assign_asset', {
      p_asset_id: values.asset_id,
      p_employee_id: values.employee_id,
      p_assigned_at: values.assigned_at,
      p_notes: values.notes.trim() || null,
    })
    setSaving(false)

    if (error) {
      setSubmitError(
        error.code === '23505'
          ? 'Aset ini sudah memiliki assignment aktif.'
          : error.message,
      )
      return
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 p-6">
        <Field label="Aset" required error={errors.asset_id}>
          <select
            className={inputClass}
            value={values.asset_id}
            onChange={(e) => setField('asset_id', e.target.value)}
          >
            <option value="">
              {assets.length === 0 ? 'Tidak ada aset tersedia' : 'Pilih aset'}
            </option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_tag} · {a.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Hanya aset berstatus Available yang bisa diserahkan.
          </p>
        </Field>

        <Field label="Karyawan" required error={errors.employee_id}>
          <select
            className={inputClass}
            value={values.employee_id}
            onChange={(e) => setField('employee_id', e.target.value)}
          >
            <option value="">Pilih karyawan</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_code} · {emp.full_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tanggal Penyerahan" required error={errors.assigned_at}>
          <input
            type="date"
            className={inputClass}
            value={values.assigned_at}
            max={todayISO()}
            onChange={(e) => setField('assigned_at', e.target.value)}
          />
        </Field>

        <Field label="Catatan">
          <textarea
            rows={3}
            className={inputClass}
            value={values.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </Field>
      </div>

      {submitError && <FormError message={submitError} />}

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Serahkan Aset'}
        </button>
      </div>
    </form>
  )
}