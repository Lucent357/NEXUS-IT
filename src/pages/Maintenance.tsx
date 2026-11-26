import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, Pencil, Plus, Search } from 'lucide-react'
import CompleteMaintenanceForm from '../components/CompleteMaintenanceForm'
import MaintenanceForm from '../components/MaintenanceForm'
import { MaintenanceStatusBadge, PriorityBadge } from '../components/MaintenanceBadges'
import Modal from '../components/Modal'
import PageHeader from '../components/Pageheader'
import { supabase } from '../lib/supabase'
import { formatDate, formatRupiah } from '../lib/format'
import type {
  AssetOption,
  MaintenancePriority,
  MaintenanceRecord,
  MaintenanceStatus,
} from '../types/database'

type Tab = MaintenanceStatus | 'all'

const priorityOptions: { value: MaintenancePriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua prioritas' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'all'>('all')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null)
  const [completing, setCompleting] = useState<MaintenanceRecord | null>(null)
  const [viewing, setViewing] = useState<MaintenanceRecord | null>(null)

  useEffect(() => {
    async function loadData() {
      const [recordsRes, assetsRes] = await Promise.all([
        supabase
          .from('maintenance_records')
          .select('*, assets(asset_tag, name)')
          .order('reported_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('assets')
          .select('id, asset_tag, name')
          .eq('status', 'available')
          .order('asset_tag'),
      ])

      const firstError = recordsRes.error ?? assetsRes.error
      if (firstError) {
        setError(firstError.message)
      } else {
        setError(null)
        setRecords((recordsRes.data ?? []) as unknown as MaintenanceRecord[])
        setAvailableAssets(assetsRes.data ?? [])
      }
      setLoading(false)
    }

    loadData()
  }, [reloadKey])

  const openCount = records.filter((r) => r.status === 'open').length
  const inProgressCount = records.filter((r) => r.status === 'in_progress').length
  const completedCount = records.filter((r) => r.status === 'completed').length
  const totalCost = records.reduce(
    (sum, r) => (r.status === 'completed' && r.cost ? sum + Number(r.cost) : sum),
    0,
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((r) => {
      const matchTab = tab === 'all' || r.status === tab
      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter
      const matchSearch =
        !q ||
        [r.assets?.asset_tag, r.assets?.name, r.issue, r.technician].some((v) =>
          v?.toLowerCase().includes(q),
        )
      return matchTab && matchPriority && matchSearch
    })
  }, [records, search, tab, priorityFilter])

  function openAdd() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(record: MaintenanceRecord) {
    setEditing(record)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    setEditing(null)
    setCompleting(null)
    setReloadKey((k) => k + 1)
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: `Semua (${records.length})` },
    { value: 'open', label: `Open (${openCount})` },
    { value: 'in_progress', label: `In Progress (${inProgressCount})` },
    { value: 'completed', label: `Completed (${completedCount})` },
  ]

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Pantau kerusakan dan perbaikan aset."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Open', value: String(openCount), tone: 'text-red-600' },
          { label: 'In Progress', value: String(inProgressCount), tone: 'text-amber-600' },
          { label: 'Completed', value: String(completedCount), tone: 'text-emerald-600' },
          { label: 'Total Biaya', value: formatRupiah(totalCost), tone: 'text-slate-900' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase text-slate-500">{card.label}</div>
            <div className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aset, masalah, teknisi..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex max-w-full overflow-x-auto rounded-lg border border-slate-300 bg-white p-0.5">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as MaintenancePriority | 'all')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          {priorityOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Laporkan Kerusakan
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
                <th className="px-4 py-3 font-medium">Aset</th>
                <th className="px-4 py-3 font-medium">Masalah</th>
                <th className="px-4 py-3 font-medium">Prioritas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Teknisi</th>
                <th className="px-4 py-3 font-medium">Dilaporkan</th>
                <th className="px-4 py-3 font-medium">Selesai</th>
                <th className="px-4 py-3 font-medium">Biaya</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const isCompleted = r.status === 'completed'
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">
                        {r.assets?.asset_tag}
                      </div>
                      <div className="font-medium text-slate-900">{r.assets?.name}</div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">{r.issue}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <MaintenanceStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">{r.technician ?? '-'}</td>
                    <td className="px-4 py-3">{formatDate(r.reported_at)}</td>
                    <td className="px-4 py-3">{formatDate(r.completed_at)}</td>
                    <td className="px-4 py-3">{formatRupiah(r.cost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewing(r)}
                          aria-label="Lihat detail"
                          title="Detail"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {!isCompleted && (
                          <>
                            <button
                              onClick={() => openEdit(r)}
                              aria-label="Ubah"
                              title="Ubah"
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setCompleting(r)}
                              aria-label="Selesaikan"
                              title="Selesaikan"
                              className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada catatan maintenance yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          title={editing ? 'Ubah Maintenance' : 'Laporkan Kerusakan'}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
        >
          <MaintenanceForm
            record={editing}
            assets={availableAssets}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false)
              setEditing(null)
            }}
          />
        </Modal>
      )}

      {completing && (
        <Modal title="Selesaikan Maintenance" onClose={() => setCompleting(null)}>
          <CompleteMaintenanceForm
            record={completing}
            onSaved={handleSaved}
            onCancel={() => setCompleting(null)}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title="Detail Maintenance" onClose={() => setViewing(null)}>
          <dl className="grid gap-4 p-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-500">Aset</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {viewing.assets?.asset_tag} · {viewing.assets?.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Status</dt>
              <dd className="mt-1">
                <MaintenanceStatusBadge status={viewing.status} />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-500">Masalah</dt>
              <dd className="mt-1 text-slate-800">{viewing.issue}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Prioritas</dt>
              <dd className="mt-1">
                <PriorityBadge priority={viewing.priority} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Teknisi</dt>
              <dd className="mt-1 text-slate-800">{viewing.technician ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Dilaporkan</dt>
              <dd className="mt-1 text-slate-800">{formatDate(viewing.reported_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Selesai</dt>
              <dd className="mt-1 text-slate-800">{formatDate(viewing.completed_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Biaya</dt>
              <dd className="mt-1 text-slate-800">{formatRupiah(viewing.cost)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-500">Catatan Penyelesaian</dt>
              <dd className="mt-1 text-slate-800">{viewing.resolution_notes ?? '-'}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </div>
  )
}