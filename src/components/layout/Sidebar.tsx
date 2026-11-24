import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  LayoutDashboard,
  Package,
  Server,
  Users,
  Wrench,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assets', label: 'Assets', icon: Package },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/assignments', label: 'Assignments', icon: ArrowLeftRight },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Server className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-semibold text-white">NEXUS IT</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
  )
}