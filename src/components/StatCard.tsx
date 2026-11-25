import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  tone: string // kelas warna untuk lingkaran ikon
}

export default function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
        <span className={`rounded-lg p-2 ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}