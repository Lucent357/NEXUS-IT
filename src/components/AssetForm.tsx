import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { DEMO_MESSAGE } from '../auth/demo'
import { supabase } from '../lib/supabase'
import type { Asset, AssetCondition, AssetStatus, Option } from '../types/database'
import Field from './FormField'
import FormError from './FormError'
import { inputClass } from '../lib/styles'

type AssetFormProps = {
  asset: Asset | null // null = mode tambah, terisi = mode ubah
  categories: Option[]
  locations: Option[]
  onSaved: () => void
  onCancel: () => void
}

type FormState = {
  asset_tag: string
  name: string
  category_id: string
  brand: string
  model: string
  serial_number: string
  purchase_date: string
  purchase_price: string
  warranty_expiry: string
  location_id: string
  condition: string
  status: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function toFormState(asset: Asset | null): FormState {
  return {
    asset_tag: asset?.asset_tag ?? '',
    name: asset?.name ?? '',
    category_id: asset?.category_id ?? '',
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    serial_number: asset?.serial_number ?? '',
    purchase_date: asset?.purchase_date ?? '',
    purchase_price: asset?.purchase_price != null ? String(asset.purchase_price) : '',
    warranty_expiry: asset?.warranty_expiry ?? '',
    location_id: asset?.location_id ?? '',
    condition: asset?.condition ?? 'good',
    status: asset?.status ?? 'available',
    notes: asset?.notes ?? '',
  }
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!values.asset_tag.trim()) errors.asset_tag = 'Asset tag wajib diisi.'
  if (!values.name.trim()) errors.name = 'Nama aset wajib diisi.'
  if (!values.category_id) errors.category_id = 'Pilih kategori.'
  if (!values.location_id) errors.location_id = 'Pilih lokasi.'

  if (values.purchase_price !== '') {
    const price = Number(values.purchase_price)
    if (Number.isNaN(price) || price < 0) {
      errors.purchase_price = 'Harga harus berupa angka dan tidak boleh negatif.'
    }
  }

  if (
    values.purchase_date &&
    values.warranty_expiry &&
    values.warranty_expiry < values.purchase_date
  ) {
    errors.warranty_expiry = 'Garansi tidak boleh berakhir sebelum tanggal pembelian.'
  }

  return errors
}

export default function AssetForm({
  asset,
  categories,
  locations,
  onSaved,
  onCancel,
}: AssetFormProps) {
  const { isDemo } = useAuth()
  const [values, setValues] = useState<FormState>(toFormState(asset))
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEdit = asset !== null
  // in_use & maintenance diatur otomatis oleh modul Assignment/Maintenance
  const statusLocked = isEdit && (asset.status === 'in_use' || asset.status === 'maintenance')

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

    const payload = {
      asset_tag: values.asset_tag.trim(),
      name: values.name.trim(),
      category_id: values.category_id,
      brand: values.brand.trim() || null,
      model: values.model.trim() || null,
      serial_number: values.serial_number.trim() || null,
      purchase_date: values.purchase_date || null,
      purchase_price: values.purchase_price === '' ? null : Number(values.purchase_price),
      warranty_expiry: values.warranty_expiry || null,
      location_id: values.location_id,
      condition: values.condition as AssetCondition,
      status: values.status as AssetStatus,
      notes: values.notes.trim() || null,
    }

    setSaving(true)
    const { error } = isEdit
      ? await supabase.from('assets').update(payload).eq('id', asset.id)
      : await supabase.from('assets').insert(payload)
    setSaving(false)

    if (error) {
      // 23505 = pelanggaran unique constraint (asset tag / serial number kembar)
      setSubmitError(
        error.code === '23505'
          ? 'Asset tag atau serial number sudah dipakai aset lain.'
          : `Gagal menyimpan: ${error.message}`,
      )
      return
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Asset Tag" required error={errors.asset_tag}>
          <input
            className={inputClass}
            value={values.asset_tag}
            onChange={(e) => setField('asset_tag', e.target.value)}
            placeholder="AST-0015"
          />
        </Field>

        <Field label="Nama Aset" required error={errors.name}>
          <input
            className={inputClass}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Dell Latitude 5440"
          />
        </Field>

        <Field label="Kategori" required error={errors.category_id}>
          <select
            className={inputClass}
            value={values.category_id}
            onChange={(e) => setField('category_id', e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

        <Field label="Brand">
          <input
            className={inputClass}
            value={values.brand}
            onChange={(e) => setField('brand', e.target.value)}
          />
        </Field>

        <Field label="Model">
          <input
            className={inputClass}
            value={values.model}
            onChange={(e) => setField('model', e.target.value)}
          />
        </Field>

        <Field label="Serial Number">
          <input
            className={inputClass}
            value={values.serial_number}
            onChange={(e) => setField('serial_number', e.target.value)}
          />
        </Field>

        <Field label="Harga Beli (Rp)" error={errors.purchase_price}>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={values.purchase_price}
            onChange={(e) => setField('purchase_price', e.target.value)}
          />
        </Field>

        <Field label="Tanggal Pembelian">
          <input
            type="date"
            className={inputClass}
            value={values.purchase_date}
            onChange={(e) => setField('purchase_date', e.target.value)}
          />
        </Field>

        <Field label="Garansi Berakhir" error={errors.warranty_expiry}>
          <input
            type="date"
            className={inputClass}
            value={values.warranty_expiry}
            onChange={(e) => setField('warranty_expiry', e.target.value)}
          />
        </Field>

        <Field label="Kondisi">
          <select
            className={inputClass}
            value={values.condition}
            onChange={(e) => setField('condition', e.target.value)}
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </Field>

        {isEdit && (
          <Field label="Status">
            <select
              className={inputClass}
              value={values.status}
              disabled={statusLocked}
              onChange={(e) => setField('status', e.target.value)}
            >
              {statusLocked ? (
                <option value={values.status}>
                  {values.status === 'in_use' ? 'In Use' : 'Maintenance'}
                </option>
              ) : (
                <>
                  <option value="available">Available</option>
                  <option value="retired">Retired</option>
                </>
              )}
            </select>
            {statusLocked && (
              <p className="mt-1 text-xs text-slate-500">
                Status ini diatur otomatis lewat modul Assignment/Maintenance.
              </p>
            )}
          </Field>
        )}

        <div className="sm:col-span-2">
          <Field label="Catatan">
            <textarea
              rows={3}
              className={inputClass}
              value={values.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </Field>
        </div>
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
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Aset'}
        </button>
      </div>
    </form>
  )
}