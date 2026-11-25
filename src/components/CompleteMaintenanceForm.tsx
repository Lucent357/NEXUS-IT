import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from './FormField'
import { inputClass } from '../lib/styles'
import { formatDate, todayISO } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { MaintenanceRecord } from '../types/database'

type CompleteMaintenanceFormProps = {
  record: MaintenanceRecord
  onSaved: () => void
  onCancel: () => void
}

type FormErrors = {
  completedAt?: string
  cost?: string
  notes?: string
}

export default function CompleteMaintenanceForm({
  record,
  onSaved,
  onCancel,
}: CompleteMaintenanceFormProps) {
  const [completedAt, setCompletedAt] = useState(todayISO())
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [condition, setCondition] = useState('')
  const [retire, setRetire] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const next: FormErrors = {}
    if (!completedAt) next.completedAt = 'Tanggal selesai wajib diisi.'
    else if (completedAt < record.reported_at)
      next.completedAt = 'Tanggal selesai tidak boleh sebelum tanggal laporan.'
    else if (completedAt > todayISO())
      next.completedAt = 'Tanggal selesai tidak boleh di masa depan.'

    if (cost !== '' && (Number.isNaN(Number(cost)) || Number(cost) < 0))
      next.cost = 'Biaya harus berupa angka dan tidak boleh negatif.'

    if (!notes.trim()) next.notes = 'Catatan penyelesaian wajib diisi.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    const { error } = await supabase.rpc('complete_maintenance', {
      p_id: record.id,
      p_completed_at: completedAt,
      p_cost: cost === '' ? null : Number(cost),
      p_resolution_notes: notes.trim(),
      p_retire: retire,
      p_condition: condition || null,
    })
    setSaving(false)

    if (error) {
      setSubmitError(error.message)
      return
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 p-6">
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="font-mono text-xs text-slate-500">{record.assets?.asset_tag}</div>
          <div className="font-medium text-slate-900">{record.assets?.name}</div>
          <div className="mt-1 text-slate-600">
            {record.issue} (dilaporkan {formatDate(record.reported_at)})
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal Selesai" required error={errors.completedAt}>
            <input
              type="date"
              className={inputClass}
              value={completedAt}
              min={record.reported_at}
              max={todayISO()}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </Field>

          <Field label="Biaya Perbaikan (Rp)" error={errors.cost}>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Catatan Penyelesaian" required error={errors.notes}>
          <textarea
            rows={3}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Apa yang dikerjakan dan hasilnya"
          />
        </Field>

        <Field label="Kondisi Aset Setelah Perbaikan">
          <select
            className={inputClass}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Tidak berubah</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </Field>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={retire}
            onChange={(e) => setRetire(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>
            Aset tidak layak diperbaiki, tandai sebagai <strong>Retired</strong>.
            <span className="block text-xs text-slate-500">
              Jika tidak dicentang, aset kembali menjadi Available.
            </span>
          </span>
        </label>
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
          {saving ? 'Memproses...' : 'Selesaikan'}
        </button>
      </div>
    </form>
  )
}