import type { AssetStatus } from '../types/database'

const styles: Record<AssetStatus, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  retired: 'bg-slate-200 text-slate-600',
}

const labels: Record<AssetStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  retired: 'Retired',
}

export default function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}