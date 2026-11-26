import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { DEMO_MESSAGE } from '../auth/demo'
import Field from './FormField'
import FormError from './FormError'
import { inputClass } from '../lib/styles'
import { todayISO } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { AssetOption, MaintenanceRecord } from '../types/database'

type MaintenanceFormProps = {
  record: MaintenanceRecord | null // null = lapor baru
  assets: AssetOption[]
  onSaved: () => void
  onCancel: () => void
}

type FormState = {
  asset_id: string
  issue: string
  priority: string
  technician: string
  reported_at: string
  status: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

export default function MaintenanceForm({
  record,
  assets,
  onSaved,
  onCancel,
}: MaintenanceFormProps) {
  const { isDemo } = useAuth()
  const isEdit = record !== null

  const [values, setValues] = useState<FormState>({
    asset_id: record?.asset_id ?? '',
    issue: record?.issue ?? '',
    priority: record?.priority ?? 'medium',
    technician: record?.technician ?? '',
    reported_at: record?.reported_at ?? todayISO(),
    status: record?.status ?? 'open',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!isEdit && !values.asset_id) next.asset_id = 'Pilih aset.'
    if (!values.issue.trim()) next.issue = 'Deskripsi masalah wajib diisi.'
    if (!isEdit) {
      if (!values.reported_at) next.reported_at = 'Tanggal laporan wajib diisi.'
      else if (values.reported_at > todayISO())
        next.reported_at = 'Tanggal laporan tidak boleh di masa depan.'
    }
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (isDemo) {
      setSubmitError(DEMO_MESSAGE)
      return
    }

    setSaving(true)
    let error
    if (isEdit) {
      // .neq: catatan yang sudah Completed tidak boleh diubah
      const res = await supabase
        .from('maintenance_records')
        .update({
          issue: values.issue.trim(),
          priority: values.priority,
          technician: values.technician.trim() || null,
          status: values.status,
        })
        .eq('id', record.id)
        .neq('status', 'completed')
      error = res.error
    } else {
      const res = await supabase.rpc('report_maintenance', {
        p_asset_id: values.asset_id,
        p_issue: values.issue.trim(),
        p_priority: values.priority,
        p_technician: values.technician.trim() || null,
        p_reported_at: values.reported_at,
      })
      error = res.error
    }
    setSaving(false)

    if (error) {
      setSubmitError(
        error.code === '23505'
          ? 'Aset ini sudah punya maintenance yang belum selesai.'
          : error.message,
      )
      return
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {isEdit ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <div className="font-mono text-xs text-slate-500">{record.assets?.asset_tag}</div>
              <div className="font-medium text-slate-900">{record.assets?.name}</div>
            </div>
          ) : (
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
                Hanya aset Available. Aset yang sedang dipegang harus dikembalikan dulu.
              </p>
            </Field>
          )}
        </div>

        <div className="sm:col-span-2">
          <Field label="Deskripsi Masalah" required error={errors.issue}>
            <textarea
              rows={3}
              className={inputClass}
              value={values.issue}
              onChange={(e) => setField('issue', e.target.value)}
              placeholder="Contoh: Layar berkedip dan sering mati sendiri"
            />
          </Field>
        </div>

        <Field label="Prioritas">
          <select
            className={inputClass}
            value={values.priority}
            onChange={(e) => setField('priority', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>

        <Field label="Teknisi">
          <input
            className={inputClass}
            value={values.technician}
            onChange={(e) => setField('technician', e.target.value)}
            placeholder="Nama teknisi (opsional)"
          />
        </Field>

        {isEdit ? (
          <Field label="Status">
            <select
              className={inputClass}
              value={values.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Untuk menyelesaikan, gunakan tombol Selesaikan di daftar.
            </p>
          </Field>
        ) : (
          <Field label="Tanggal Laporan" required error={errors.reported_at}>
            <input
              type="date"
              className={inputClass}
              value={values.reported_at}
              max={todayISO()}
              onChange={(e) => setField('reported_at', e.target.value)}
            />
          </Field>
        )}
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
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Laporkan'}
        </button>
      </div>
    </form>
  )
}