import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  LayoutDashboard,
  Package,
  Server,
  Users,
  Wrench,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assets', label: 'Assets', icon: Package },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/assignments', label: 'Assignments', icon: ArrowLeftRight },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  // Tutup dengan tombol Esc (hanya saat panel terbuka)
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* Latar gelap, hanya di layar kecil */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-400" />
            <span className="text-lg font-semibold text-white">NEXUS IT</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}