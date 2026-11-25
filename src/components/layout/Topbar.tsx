import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

export default function Topbar() {
  const { session, profile, isDemo, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const email = session?.user.email ?? ''
  const name = profile?.full_name || email || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        {isDemo && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Mode demo: Anda dapat mencoba semua fitur, tetapi perubahan tidak akan disimpan.
          </span>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">{name}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium text-slate-900">{name}</div>
              <div className="truncate text-xs text-slate-500">{email}</div>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  profile?.role === 'admin'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {profile?.role === 'admin' ? 'Admin' : 'Demo (hanya baca)'}
              </span>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <button
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}