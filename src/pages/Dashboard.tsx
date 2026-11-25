import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  ArrowLeftRight,
  Check,
  Package,
  PackageCheck,
  Undo2,
  UserCheck,
  Wallet,
  Wrench,
} from 'lucide-react'
import BarList from '../components/BarList'
import { PriorityBadge } from '../components/MaintenanceBadges'
import PageHeader from '../components/Pageheader'
import StatCard from '../components/StatCard'
import { supabase } from '../lib/supabase'
import { addDaysISO, formatDate, formatRupiah, todayISO } from '../lib/format'
import type { AssetStatus, MaintenancePriority, MaintenanceStatus } from '../types/database'

type DashAsset = {
  id: string
  asset_tag: string
  name: string
  status: AssetStatus
  purchase_price: number | null
  warranty_expiry: string | null
  categories: { name: string } | null
  locations: { name: string } | null
}

type DashAssignment = {
  id: string
  assigned_at: string
  returned_at: string | null
  assets: { asset_tag: string; name: string } | null
  employees: { full_name: string } | null
}

type DashMaintenance = {
  id: string
  issue: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  reported_at: string
  completed_at: string | null
  assets: { asset_tag: string; name: string } | null
}

type ActivityKind = 'assigned' | 'returned' | 'reported' | 'completed'

type Activity = {
  key: string
  date: string
  kind: ActivityKind
  title: string
  detail: string
}

const activityStyles: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  assigned: { icon: ArrowLeftRight, tone: 'bg-blue-100 text-blue-600' },
  returned: { icon: Undo2, tone: 'bg-slate-200 text-slate-600' },
  reported: { icon: Wrench, tone: 'bg-amber-100 text-amber-600' },
  completed: { icon: Check, tone: 'bg-emerald-100 text-emerald-600' },
}

const priorityRank: Record<MaintenancePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function groupCount<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label),
  )
}

function expiryOf(asset: DashAsset): string {
  return asset.warranty_expiry ?? ''
}

export default function Dashboard() {
  const [assets, setAssets] = useState<DashAsset[]>([])
  const [assignments, setAssignments] = useState<DashAssignment[]>([])
  const [maintenance, setMaintenance] = useState<DashMaintenance[]>([])
  const [today, setToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const [assetsRes, assignmentsRes, maintenanceRes] = await Promise.all([
        supabase
          .from('assets')
          .select(
            'id, asset_tag, name, status, purchase_price, warranty_expiry, categories(name), locations(name)',
          ),
        supabase
          .from('assignments')
          .select('id, assigned_at, returned_at, assets(asset_tag, name), employees(full_name)'),
        supabase
          .from('maintenance_records')
          .select('id, issue, priority, status, reported_at, completed_at, assets(asset_tag, name)'),
      ])

      const firstError = assetsRes.error ?? assignmentsRes.error ?? maintenanceRes.error
      if (firstError) {
        setError(firstError.message)
      } else {
        setError(null)
        setAssets((assetsRes.data ?? []) as unknown as DashAsset[])
        setAssignments((assignmentsRes.data ?? []) as unknown as DashAssignment[])
        setMaintenance((maintenanceRes.data ?? []) as unknown as DashMaintenance[])
        setToday(todayISO())
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const counts = useMemo(() => {
    const c: Record<AssetStatus, number> = {
      available: 0,
      in_use: 0,
      maintenance: 0,
      retired: 0,
    }
    for (const a of assets) c[a.status] += 1
    return c
  }, [assets])

  const totalValue = useMemo(
    () =>
      assets
        .filter((a) => a.status !== 'retired')
        .reduce((sum, a) => sum + Number(a.purchase_price ?? 0), 0),
    [assets],
  )

  const byCategory = useMemo(
    () => groupCount(assets, (a) => a.categories?.name ?? 'Tanpa kategori'),
    [assets],
  )

  const byLocation = useMemo(
    () => groupCount(assets, (a) => a.locations?.name ?? 'Tanpa lokasi'),
    [assets],
  )

  const openMaintenance = useMemo(
    () =>
      maintenance
        .filter((m) => m.status !== 'completed')
        .sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            b.reported_at.localeCompare(a.reported_at),
        ),
    [maintenance],
  )

  const warranty = useMemo(() => {
    if (!today) return { expiring: [] as DashAsset[], expiredCount: 0 }
    const limit = addDaysISO(today, 90)
    const active = assets.filter((a) => a.status !== 'retired' && a.warranty_expiry)
    return {
      expiring: active
        .filter((a) => expiryOf(a) >= today && expiryOf(a) <= limit)
        .sort((a, b) => expiryOf(a).localeCompare(expiryOf(b))),
      expiredCount: active.filter((a) => expiryOf(a) < today).length,
    }
  }, [assets, today])

  const activities = useMemo(() => {
    const list: Activity[] = []

    for (const a of assignments) {
      const asset = `${a.assets?.asset_tag ?? '-'} · ${a.assets?.name ?? '-'}`
      const person = a.employees?.full_name ?? '-'
      list.push({
        key: `assigned-${a.id}`,
        date: a.assigned_at,
        kind: 'assigned',
        title: 'Aset diserahkan',
        detail: `${asset} kepada ${person}`,
      })
      if (a.returned_at) {
        list.push({
          key: `returned-${a.id}`,
          date: a.returned_at,
          kind: 'returned',
          title: 'Aset dikembalikan',
          detail: `${asset} dari ${person}`,
        })
      }
    }

    for (const m of maintenance) {
      const asset = `${m.assets?.asset_tag ?? '-'} · ${m.assets?.name ?? '-'}`
      list.push({
        key: `reported-${m.id}`,
        date: m.reported_at,
        kind: 'reported',
        title: 'Kerusakan dilaporkan',
        detail: `${asset}: ${m.issue}`,
      })
      if (m.completed_at) {
        list.push({
          key: `completed-${m.id}`,
          date: m.completed_at,
          kind: 'completed',
          title: 'Maintenance selesai',
          detail: asset,
        })
      }
    }

    return list.sort((x, y) => y.date.localeCompare(x.date)).slice(0, 8)
  }, [assignments, maintenance])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan aset dan aktivitas terbaru."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data: {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Memuat data...</p>}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Aset" value={assets.length} icon={Package} tone="bg-indigo-100 text-indigo-600" />
            <StatCard label="In Use" value={counts.in_use} icon={UserCheck} tone="bg-blue-100 text-blue-600" />
            <StatCard label="Available" value={counts.available} icon={PackageCheck} tone="bg-emerald-100 text-emerald-600" />
            <StatCard label="Maintenance" value={counts.maintenance} icon={Wrench} tone="bg-amber-100 text-amber-600" />
            <StatCard label="Retired" value={counts.retired} icon={Archive} tone="bg-slate-200 text-slate-600" />
            <StatCard label="Nilai Aset Aktif" value={formatRupiah(totalValue)} icon={Wallet} tone="bg-violet-100 text-violet-600" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Aktivitas Terbaru</h2>
              {activities.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
              ) : (
                <ul className="space-y-4">
                  {activities.map((a) => {
                    const { icon: Icon, tone } = activityStyles[a.kind]
                    return (
                      <li key={a.key} className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full p-2 ${tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900">{a.title}</div>
                          <div className="truncate text-sm text-slate-600">{a.detail}</div>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">{formatDate(a.date)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Perlu Perhatian</h2>

              <h3 className="mb-2 text-xs font-medium uppercase text-slate-500">
                Maintenance belum selesai ({openMaintenance.length})
              </h3>
              {openMaintenance.length === 0 ? (
                <p className="mb-5 text-sm text-slate-500">Tidak ada.</p>
              ) : (
                <ul className="mb-5 space-y-3">
                  {openMaintenance.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {m.assets?.asset_tag} · {m.assets?.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">{m.issue}</div>
                      </div>
                      <PriorityBadge priority={m.priority} />
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mb-2 text-xs font-medium uppercase text-slate-500">
                Garansi berakhir ≤ 90 hari ({warranty.expiring.length})
              </h3>
              {warranty.expiring.length === 0 ? (
                <p className="text-sm text-slate-500">Tidak ada.</p>
              ) : (
                <ul className="space-y-3">
                  {warranty.expiring.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0 truncate text-sm font-medium text-slate-900">
                        {a.asset_tag} · {a.name}
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">
                        {formatDate(a.warranty_expiry)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {warranty.expiredCount} aset aktif sudah melewati masa garansi.
              </p>
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Aset per Kategori</h2>
              <BarList items={byCategory} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Aset per Lokasi</h2>
              <BarList items={byLocation} />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}