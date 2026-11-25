import { useEffect, useMemo, useState } from 'react'
import { Archive, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import AssetForm from '../components/AssetForm'
import Modal from '../components/Modal'
import PageHeader from '../components/Pageheader'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Asset, AssetStatus, Option } from '../types/database'
import ConfirmDialog from '../components/ConfirmDialog'

const statusOptions: { value: AssetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
]

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [locations, setLocations] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [pending, setPending] = useState<{ type: 'retire' | 'delete'; asset: Asset } | null>(null)
const [actionLoading, setActionLoading] = useState(false)
const [actionError, setActionError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

useEffect(() => {
  async function loadData() {
    const [assetsRes, categoriesRes, locationsRes] = await Promise.all([
      supabase
        .from('assets')
        .select('*, categories(name), locations(name)')
        .order('asset_tag'),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('locations').select('id, name').order('name'),
    ])

    const firstError = assetsRes.error ?? categoriesRes.error ?? locationsRes.error
    if (firstError) {
      setError(firstError.message)
    } else {
      setError(null)
      setAssets((assetsRes.data ?? []) as unknown as Asset[])
      setCategories(categoriesRes.data ?? [])
      setLocations(locationsRes.data ?? [])
    }
    setLoading(false)
  }

  loadData()
}, [reloadKey])

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets.filter((a) => {
      const matchSearch =
        !q ||
        [a.asset_tag, a.name, a.brand, a.model].some((v) =>
          v?.toLowerCase().includes(q),
        )
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      const matchCategory =
        categoryFilter === 'all' || a.categories?.name === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [assets, search, statusFilter, categoryFilter])

  function openAdd() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(asset: Asset) {
    setEditing(asset)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

 function handleSaved() {
  closeForm()
  setReloadKey((k) => k + 1)
}

function askConfirm(type: 'retire' | 'delete', asset: Asset) {
  setActionError(null)
  setPending({ type, asset })
}

async function handleConfirm() {
  if (!pending) return
  const { type, asset } = pending

  setActionLoading(true)
  setActionError(null)

  const { error } =
    type === 'retire'
      ? await supabase.from('assets').update({ status: 'retired' }).eq('id', asset.id)
      : await supabase.from('assets').delete().eq('id', asset.id)

  setActionLoading(false)

  if (error) {
    // 23503 = pelanggaran foreign key (aset masih dipakai di tabel lain)
    setActionError(
      error.code === '23503'
        ? 'Aset ini punya riwayat assignment atau maintenance sehingga tidak bisa dihapus. Gunakan Retire.'
        : `Gagal memproses: ${error.message}`,
    )
    return
  }

  setPending(null)
  setReloadKey((k) => k + 1)
}

  return (
    <div>
      <PageHeader
        title="Asset Inventory"
        description="Kelola seluruh aset IT perusahaan."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tag, nama, brand, model..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Aset
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data: {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Memuat data...</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Asset Tag</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Kondisi</th>
                <th className="px-4 py-3 font-medium">Garansi s/d</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((a) => (
  <tr key={a.id} className="hover:bg-slate-50">
    <td className="px-4 py-3 font-mono text-xs text-slate-600">
      {a.asset_tag}
    </td>
    <td className="px-4 py-3">
      <div className="font-medium text-slate-900">{a.name}</div>
      <div className="text-xs text-slate-500">
        {[a.brand, a.model].filter(Boolean).join(' · ')}
      </div>
    </td>
    <td className="px-4 py-3">{a.categories?.name ?? '-'}</td>
    <td className="px-4 py-3">{a.locations?.name ?? '-'}</td>
    <td className="px-4 py-3">
      <StatusBadge status={a.status} />
    </td>
    <td className="px-4 py-3 capitalize">{a.condition}</td>
    <td className="px-4 py-3">{formatDate(a.warranty_expiry)}</td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => openEdit(a)}
          aria-label={`Ubah ${a.name}`}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {a.status === 'available' && (
          <button
            onClick={() => askConfirm('retire', a)}
            aria-label={`Retire ${a.name}`}
            title="Retire"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-amber-600"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}

        {(a.status === 'available' || a.status === 'retired') && (
          <button
            onClick={() => askConfirm('delete', a)}
            aria-label={`Hapus ${a.name}`}
            title="Hapus"
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </td>
  </tr>
))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada aset yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <p className="mt-3 text-xs text-slate-500">
          Menampilkan {filteredAssets.length} dari {assets.length} aset
        </p>
      )}

      {showForm && (
        <Modal title={editing ? 'Ubah Aset' : 'Tambah Aset'} onClose={closeForm}>
          <AssetForm
            asset={editing}
            categories={categories}
            locations={locations}
            onSaved={handleSaved}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {pending && (
  <ConfirmDialog
    title={pending.type === 'retire' ? 'Retire aset?' : 'Hapus aset?'}
    message={
      pending.type === 'retire'
        ? `${pending.asset.asset_tag} · ${pending.asset.name} akan ditandai Retired. Riwayatnya tetap tersimpan dan bisa diaktifkan kembali lewat menu ubah.`
        : `${pending.asset.asset_tag} · ${pending.asset.name} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
    }
    confirmLabel={pending.type === 'retire' ? 'Retire' : 'Hapus'}
    danger={pending.type === 'delete'}
    loading={actionLoading}
    error={actionError}
    onConfirm={handleConfirm}
    onCancel={() => setPending(null)}
  />
)}
    </div>
  )
}