import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from './FormField'
import { inputClass } from '../lib/styles'
import { supabase } from '../lib/supabase'
import type { Employee, EmployeeStatus, Option } from '../types/database'

type EmployeeFormProps = {
  employee: Employee | null // null = mode tambah
  departments: Option[]
  locations: Option[]
  onSaved: () => void
  onCancel: () => void
}

type FormState = {
  employee_code: string
  full_name: string
  email: string
  job_title: string
  department_id: string
  location_id: string
  status: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function toFormState(employee: Employee | null): FormState {
  return {
    employee_code: employee?.employee_code ?? '',
    full_name: employee?.full_name ?? '',
    email: employee?.email ?? '',
    job_title: employee?.job_title ?? '',
    department_id: employee?.department_id ?? '',
    location_id: employee?.location_id ?? '',
    status: employee?.status ?? 'active',
  }
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!values.employee_code.trim()) errors.employee_code = 'Kode karyawan wajib diisi.'
  if (!values.full_name.trim()) errors.full_name = 'Nama lengkap wajib diisi.'

  if (!values.email.trim()) {
    errors.email = 'Email wajib diisi.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Format email tidak valid.'
  }

  if (!values.department_id) errors.department_id = 'Pilih departemen.'
  if (!values.location_id) errors.location_id = 'Pilih lokasi.'

  return errors
}

export default function EmployeeForm({
  employee,
  departments,
  locations,
  onSaved,
  onCancel,
}: EmployeeFormProps) {
  const [values, setValues] = useState<FormState>(toFormState(employee))
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEdit = employee !== null
  const holdsAssets =
    isEdit && employee.assignments.some((a) => a.returned_at === null)

  function setField(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      employee_code: values.employee_code.trim(),
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      job_title: values.job_title.trim() || null,
      department_id: values.department_id,
      location_id: values.location_id,
      status: values.status as EmployeeStatus,
    }

    setSaving(true)
    const { error } = isEdit
      ? await supabase.from('employees').update(payload).eq('id', employee.id)
      : await supabase.from('employees').insert(payload)
    setSaving(false)

    if (error) {
      setSubmitError(
        error.code === '23505'
          ? 'Kode karyawan atau email sudah dipakai karyawan lain.'
          : `Gagal menyimpan: ${error.message}`,
      )
      return
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Kode Karyawan" required error={errors.employee_code}>
          <input
            className={inputClass}
            value={values.employee_code}
            onChange={(e) => setField('employee_code', e.target.value)}
            placeholder="EMP-009"
          />
        </Field>

        <Field label="Nama Lengkap" required error={errors.full_name}>
          <input
            className={inputClass}
            value={values.full_name}
            onChange={(e) => setField('full_name', e.target.value)}
          />
        </Field>

        <Field label="Email" required error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="nama@nexus.example"
          />
        </Field>

        <Field label="Jabatan">
          <input
            className={inputClass}
            value={values.job_title}
            onChange={(e) => setField('job_title', e.target.value)}
          />
        </Field>

        <Field label="Departemen" required error={errors.department_id}>
          <select
            className={inputClass}
            value={values.department_id}
            onChange={(e) => setField('department_id', e.target.value)}
          >
            <option value="">Pilih departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lokasi" required error={errors.location_id}>
          <select
            className={inputClass}
            value={values.location_id}
            onChange={(e) => setField('location_id', e.target.value)}
          >
            <option value="">Pilih lokasi</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>

        {isEdit && (
          <Field label="Status">
            <select
              className={inputClass}
              value={values.status}
              disabled={holdsAssets}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {holdsAssets && (
              <p className="mt-1 text-xs text-slate-500">
                Karyawan masih memegang aset. Kembalikan dulu lewat modul Assignment
                sebelum menonaktifkan.
              </p>
            )}
          </Field>
        )}
      </div>

      {submitError && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

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
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
        </button>
      </div>
    </form>
  )
}