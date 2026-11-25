import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from './FormField'
import { inputClass } from '../lib/styles'
import { formatDate, todayISO } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Assignment } from '../types/database'

type ReturnFormProps = {
  assignment: Assignment
  onSaved: () => void
  onCancel: () => void
}

export default function ReturnForm({ assignment, onSaved, onCancel }: ReturnFormProps) {
  const [returnedAt, setReturnedAt] = useState(todayISO())
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!returnedAt) {
      setDateError('Tanggal pengembalian wajib diisi.')
      return
    }
    if (returnedAt < assignment.assigned_at) {
      setDateError('Tanggal pengembalian tidak boleh sebelum tanggal penyerahan.')
      return
    }
    if (returnedAt > todayISO()) {
      setDateError('Tanggal pengembalian tidak boleh di masa depan.')
      return
    }
    setDateError(null)

    setSaving(true)
    const { error } = await supabase.rpc('return_asset', {
      p_assignment_id: assignment.id,
      p_returned_at: returnedAt,
      p_condition: condition || null,
      p_notes: notes.trim() || null,
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
          <div className="font-mono text-xs text-slate-500">
            {assignment.assets?.asset_tag}
          </div>
          <div className="font-medium text-slate-900">{assignment.assets?.name}</div>
          <div className="mt-1 text-slate-600">
            Dipegang {assignment.employees?.full_name} sejak{' '}
            {formatDate(assignment.assigned_at)}
          </div>
        </div>

        <Field label="Tanggal Pengembalian" required error={dateError ?? undefined}>
          <input
            type="date"
            className={inputClass}
            value={returnedAt}
            min={assignment.assigned_at}
            max={todayISO()}
            onChange={(e) => setReturnedAt(e.target.value)}
          />
        </Field>

        <Field label="Kondisi Saat Dikembalikan">
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

        <Field label="Catatan Pengembalian">
          <textarea
            rows={3}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
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
          {saving ? 'Memproses...' : 'Kembalikan Aset'}
        </button>
      </div>
    </form>
  )
}