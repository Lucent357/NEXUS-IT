import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Undo2 } from 'lucide-react'
import AssignForm from '../components/AssignForm'
import Modal from '../components/Modal'
import PageHeader from '../components/Pageheader'
import ReturnForm from '../components/ReturnForm'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Assignment, AssetOption, EmployeeOption } from '../types/database'

type Tab = 'all' | 'active' | 'returned'

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([])
  const [activeEmployees, setActiveEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')

  const [showAssign, setShowAssign] = useState(false)
  const [returning, setReturning] = useState<Assignment | null>(null)

  useEffect(() => {
    async function loadData() {
      const [assignmentsRes, assetsRes, employeesRes] = await Promise.all([
        supabase
          .from('assignments')
          .select(
            `id, asset_id, employee_id, assigned_at, returned_at, notes,
             assets(asset_tag, name), employees(employee_code, full_name)`,
          )
          .order('assigned_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('assets')
          .select('id, asset_tag, name')
          .eq('status', 'available')
          .order('asset_tag'),
        supabase
          .from('employees')
          .select('id, employee_code, full_name')
          .eq('status', 'active')
          .order('full_name'),
      ])

      const firstError = assignmentsRes.error ?? assetsRes.error ?? employeesRes.error
      if (firstError) {
        setError(firstError.message)
      } else {
        setError(null)
        setAssignments((assignmentsRes.data ?? []) as unknown as Assignment[])
        setAvailableAssets(assetsRes.data ?? [])
        setActiveEmployees(employeesRes.data ?? [])
      }
      setLoading(false)
    }

    loadData()
  }, [reloadKey])

  const activeCount = assignments.filter((a) => a.returned_at === null).length
  const returnedCount = assignments.length - activeCount

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assignments.filter((a) => {
      const matchTab =
        tab === 'all' ||
        (tab === 'active' && a.returned_at === null) ||
        (tab === 'returned' && a.returned_at !== null)
      const matchSearch =
        !q ||
        [a.assets?.asset_tag, a.assets?.name, a.employees?.full_name, a.employees?.employee_code].some(
          (v) => v?.toLowerCase().includes(q),
        )
      return matchTab && matchSearch
    })
  }, [assignments, search, tab])

  function handleSaved() {
    setShowAssign(false)
    setReturning(null)
    setReloadKey((k) => k + 1)
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: `Semua (${assignments.length})` },
    { value: 'active', label: `Aktif (${activeCount})` },
    { value: 'returned', label: `Dikembalikan (${returnedCount})` },
  ]

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Penyerahan dan pengembalian aset."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aset atau karyawan..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
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

        <button
          onClick={() => setShowAssign(true)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Serahkan Aset
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
                <th className="px-4 py-3 font-medium">Karyawan</th>
                <th className="px-4 py-3 font-medium">Diserahkan</th>
                <th className="px-4 py-3 font-medium">Dikembalikan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => {
                const isActive = a.returned_at === null
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">
                        {a.assets?.asset_tag}
                      </div>
                      <div className="font-medium text-slate-900">{a.assets?.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {a.employees?.full_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.employees?.employee_code}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDate(a.assigned_at)}</td>
                    <td className="px-4 py-3">{formatDate(a.returned_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Dikembalikan'}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">{a.notes ?? '-'}</td>
                    <td className="px-4 py-3">
                      {isActive && (
                        <button
                          onClick={() => setReturning(a)}
                          aria-label={`Kembalikan ${a.assets?.name}`}
                          title="Kembalikan"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada assignment yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAssign && (
        <Modal title="Serahkan Aset" onClose={() => setShowAssign(false)}>
          <AssignForm
            assets={availableAssets}
            employees={activeEmployees}
            onSaved={handleSaved}
            onCancel={() => setShowAssign(false)}
          />
        </Modal>
      )}

      {returning && (
        <Modal title="Kembalikan Aset" onClose={() => setReturning(null)}>
          <ReturnForm
            assignment={returning}
            onSaved={handleSaved}
            onCancel={() => setReturning(null)}
          />
        </Modal>
      )}
    </div>
  )
}