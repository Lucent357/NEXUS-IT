type BarItem = {
  label: string
  value: number
}

export default function BarList({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada data.</p>
  }

  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-700">{item.label}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-indigo-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}