import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2, UserX } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import EmployeeForm from '../components/EmployeeForm'
import Modal from '../components/Modal'
import PageHeader from '../components/Pageheader'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Employee, EmployeeStatus, Option } from '../types/database'

const statusOptions: { value: EmployeeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function activeAssignments(employee: Employee) {
  return employee.assignments.filter((a) => a.returned_at === null)
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Option[]>([])
  const [locations, setLocations] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [viewing, setViewing] = useState<Employee | null>(null)
  const [pending, setPending] = useState<{
    type: 'deactivate' | 'delete'
    employee: Employee
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const [employeesRes, departmentsRes, locationsRes] = await Promise.all([
        supabase
          .from('employees')
          .select(
            `*, departments(name), locations(name),
             assignments(id, assigned_at, returned_at, assets(asset_tag, name))`,
          )
          .order('employee_code'),
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
      ])

      const firstError = employeesRes.error ?? departmentsRes.error ?? locationsRes.error
      if (firstError) {
        setError(firstError.message)
      } else {
        setError(null)
        setEmployees((employeesRes.data ?? []) as unknown as Employee[])
        setDepartments(departmentsRes.data ?? [])
        setLocations(locationsRes.data ?? [])
      }
      setLoading(false)
    }

    loadData()
  }, [reloadKey])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        [e.employee_code, e.full_name, e.email, e.job_title].some((v) =>
          v?.toLowerCase().includes(q),
        )
      const matchStatus = statusFilter === 'all' || e.status === statusFilter
      const matchDepartment =
        departmentFilter === 'all' || e.departments?.name === departmentFilter
      return matchSearch && matchStatus && matchDepartment
    })
  }, [employees, search, statusFilter, departmentFilter])

  function openAdd() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(employee: Employee) {
    setEditing(employee)
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

  function askConfirm(type: 'deactivate' | 'delete', employee: Employee) {
    setActionError(null)
    setPending({ type, employee })
  }

  async function handleConfirm() {
    if (!pending) return
    const { type, employee } = pending

    setActionLoading(true)
    setActionError(null)

    const { error } =
      type === 'deactivate'
        ? await supabase.from('employees').update({ status: 'inactive' }).eq('id', employee.id)
        : await supabase.from('employees').delete().eq('id', employee.id)

    setActionLoading(false)

    if (error) {
      setActionError(
        error.code === '23503'
          ? 'Karyawan ini punya riwayat assignment sehingga tidak bisa dihapus. Biarkan berstatus Inactive.'
          : `Gagal memproses: ${error.message}`,
      )
      return
    }

    setPending(null)
    setReloadKey((k) => k + 1)
  }

  const viewingActive = viewing ? activeAssignments(viewing) : []
  const viewingHistory = viewing
    ? viewing.assignments.filter((a) => a.returned_at !== null)
    : []

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Kelola data karyawan dan aset yang mereka pegang."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, email, jabatan..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">Semua departemen</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'all')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          {statusOptions.map((o) => (
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
          Tambah Karyawan
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
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Karyawan</th>
                <th className="px-4 py-3 font-medium">Departemen</th>
                <th className="px-4 py-3 font-medium">Jabatan</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Aset</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((e) => {
                const heldCount = activeAssignments(e).length
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {e.employee_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{e.full_name}</div>
                      <div className="text-xs text-slate-500">{e.email}</div>
                    </td>
                    <td className="px-4 py-3">{e.departments?.name ?? '-'}</td>
                    <td className="px-4 py-3">{e.job_title ?? '-'}</td>
                    <td className="px-4 py-3">{e.locations?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {heldCount} aset
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {e.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewing(e)}
                          aria-label={`Lihat aset ${e.full_name}`}
                          title="Lihat aset"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => openEdit(e)}
                          aria-label={`Ubah ${e.full_name}`}
                          title="Ubah"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {e.status === 'active' && heldCount === 0 && (
                          <button
                            onClick={() => askConfirm('deactivate', e)}
                            aria-label={`Nonaktifkan ${e.full_name}`}
                            title="Nonaktifkan"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-amber-600"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}

                        {e.status === 'inactive' && (
                          <button
                            onClick={() => askConfirm('delete', e)}
                            aria-label={`Hapus ${e.full_name}`}
                            title="Hapus"
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada karyawan yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <p className="mt-3 text-xs text-slate-500">
          Menampilkan {filteredEmployees.length} dari {employees.length} karyawan
        </p>
      )}

      {showForm && (
        <Modal title={editing ? 'Ubah Karyawan' : 'Tambah Karyawan'} onClose={closeForm}>
          <EmployeeForm
            employee={editing}
            departments={departments}
            locations={locations}
            onSaved={handleSaved}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title={`Aset ${viewing.full_name}`} onClose={() => setViewing(null)}>
          <div className="space-y-6 p-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Sedang dipegang ({viewingActive.length})
              </h3>
              {viewingActive.length === 0 ? (
                <p className="text-sm text-slate-500">Tidak ada aset yang sedang dipegang.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {viewingActive.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <span className="font-mono text-xs text-slate-500">
                          {a.assets?.asset_tag}
                        </span>
                        <div className="font-medium text-slate-900">{a.assets?.name}</div>
                      </div>
                      <span className="text-xs text-slate-500">
                        sejak {formatDate(a.assigned_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Riwayat ({viewingHistory.length})
              </h3>
              {viewingHistory.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada riwayat pengembalian.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {viewingHistory.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <span className="font-mono text-xs text-slate-500">
                          {a.assets?.asset_tag}
                        </span>
                        <div className="font-medium text-slate-900">{a.assets?.name}</div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(a.assigned_at)} – {formatDate(a.returned_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Modal>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.type === 'deactivate' ? 'Nonaktifkan karyawan?' : 'Hapus karyawan?'}
          message={
            pending.type === 'deactivate'
              ? `${pending.employee.full_name} akan ditandai Inactive. Datanya dan riwayat assignment tetap tersimpan.`
              : `${pending.employee.full_name} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
          }
          confirmLabel={pending.type === 'deactivate' ? 'Nonaktifkan' : 'Hapus'}
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