'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Utensils, ShoppingBasket, Wallet, Zap, CalendarHeart,
  LogOut, BookOpen, UtensilsCrossed, Gift, Menu, X, Database, HeartPulse, Plane,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const ALL_NAV_ITEMS = [
  { key: 'meals',       href: '/meals',          label: 'Comidas',          icon: Utensils,        activeColor: 'text-orange-600',  hoverColor: 'hover:text-orange-500'  },
  { key: 'recipes',     href: '/recipes',         label: 'Recetas',          icon: BookOpen,        activeColor: 'text-emerald-600', hoverColor: 'hover:text-emerald-600' },
  { key: 'shopping',    href: '/shopping-list',   label: 'Compra',           icon: ShoppingBasket,  activeColor: 'text-emerald-600', hoverColor: 'hover:text-emerald-600' },
  { key: 'finances',    href: '/finances',        label: 'Finanzas',         icon: Wallet,          activeColor: 'text-blue-600',    hoverColor: 'hover:text-blue-500'    },
  { key: 'utilities',   href: '/utilities',       label: 'Suministros',      icon: Zap,             activeColor: 'text-yellow-600',  hoverColor: 'hover:text-yellow-500'  },
  { key: 'services',    href: '/services',        label: 'Bonos',            icon: CalendarHeart,   activeColor: 'text-emerald-600', hoverColor: 'hover:text-emerald-500' },
  { key: 'restaurants', href: '/restaurants',     label: 'Restaurantes',     icon: UtensilsCrossed, activeColor: 'text-rose-600',    hoverColor: 'hover:text-rose-500'    },
  { key: 'wishlist',    href: '/wishlist',        label: 'Lista de deseos',  icon: Gift,            activeColor: 'text-pink-600',    hoverColor: 'hover:text-pink-500'    },
  { key: 'health',      href: '/health',          label: 'Salud',            icon: HeartPulse,      activeColor: 'text-rose-600',    hoverColor: 'hover:text-rose-500'    },
  { key: 'trips',       href: '/trips',           label: 'Viajes',           icon: Plane,           activeColor: 'text-violet-600',  hoverColor: 'hover:text-violet-500'  },
]

type Props = {
  permissions: string[]
  isAdmin: boolean
  displayName: string
}

function NavLinks({ permissions, isAdmin, onClick }: Omit<Props, 'displayName'> & { onClick?: () => void }) {
  const pathname = usePathname()

  const visibleItems = ALL_NAV_ITEMS.filter(item => permissions.includes(item.key))

  return (
    <>
      <Link
        href="/"
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
          pathname === '/' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
        }`}
      >
        <Home size={20} /> <span>Inicio</span>
      </Link>

      {visibleItems.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              active
                ? `bg-slate-50 ${item.activeColor}`
                : `text-slate-600 hover:bg-slate-50 ${item.hoverColor}`
            }`}
          >
            <Icon size={20} /> <span>{item.label}</span>
          </Link>
        )
      })}

      {isAdmin && (
        <Link
          href="/admin"
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
            pathname === '/admin' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
          }`}
        >
          <Database size={20} /> <span>Administración</span>
        </Link>
      )}
    </>
  )
}

export default function AppNavigation({ permissions, isAdmin, displayName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Family<span className="text-emerald-500">Tools</span>
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavLinks permissions={permissions} isAdmin={isAdmin} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-slate-700 truncate">{displayName}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            >
              <LogOut size={18} /> <span className="truncate">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[199] bg-white border-b border-slate-200 flex items-center px-4 h-14 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 -ml-2"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-xl font-black text-slate-900 tracking-tight ml-3">
          Family<span className="text-emerald-500">Tools</span>
        </h2>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[200]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sliding sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-[201] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Family<span className="text-emerald-500">Tools</span>
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NavLinks permissions={permissions} isAdmin={isAdmin} onClick={() => setOpen(false)} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-slate-700 truncate">{displayName}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            >
              <LogOut size={18} /> <span className="truncate">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
