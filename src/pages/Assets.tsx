import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../components/Pageheader'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Asset, AssetStatus } from '../types/database'

const statusOptions: { value: AssetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
]

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    async function loadAssets() {
      const { data, error } = await supabase
        .from('assets')
        .select(
          `id, asset_tag, name, brand, model, status, condition,
           purchase_price, warranty_expiry,
           categories(name), locations(name)`,
        )
        .order('asset_tag')

      if (error) setError(error.message)
      else setAssets((data ?? []) as unknown as Asset[])
      setLoading(false)
    }

    loadAssets()
  }, [])

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map((a) => a.categories?.name)
            .filter((name): name is string => !!name),
        ),
      ).sort(),
    [assets],
  )

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

  return (
    <div>
      <PageHeader
        title="Asset Inventory"
        description="Kelola seluruh aset IT perusahaan."
      />

      <div className="mb-4 flex flex-wrap gap-3">
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
          {categoryOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
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
                </tr>
              ))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
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
    </div>
  )
}