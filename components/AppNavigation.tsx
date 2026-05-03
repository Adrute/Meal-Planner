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
  { key: 'meals',       href: '/meals',          label: 'Comidas',          icon: Utensils,        activeColor: 'text-orange-400',  activeBg: 'bg-orange-50',   hoverColor: 'hover:text-orange-400  hover:bg-orange-50/60'  },
  { key: 'recipes',     href: '/recipes',         label: 'Recetas',          icon: BookOpen,        activeColor: 'text-teal-500',    activeBg: 'bg-teal-50',     hoverColor: 'hover:text-teal-500    hover:bg-teal-50/60'    },
  { key: 'shopping',    href: '/shopping-list',   label: 'Compra',           icon: ShoppingBasket,  activeColor: 'text-teal-500',    activeBg: 'bg-teal-50',     hoverColor: 'hover:text-teal-500    hover:bg-teal-50/60'    },
  { key: 'finances',    href: '/finances',        label: 'Finanzas',         icon: Wallet,          activeColor: 'text-sky-500',     activeBg: 'bg-sky-50',      hoverColor: 'hover:text-sky-500     hover:bg-sky-50/60'     },
  { key: 'utilities',   href: '/utilities',       label: 'Suministros',      icon: Zap,             activeColor: 'text-amber-500',   activeBg: 'bg-amber-50',    hoverColor: 'hover:text-amber-500   hover:bg-amber-50/60'   },
  { key: 'services',    href: '/services',        label: 'Bonos',            icon: CalendarHeart,   activeColor: 'text-teal-500',    activeBg: 'bg-teal-50',     hoverColor: 'hover:text-teal-500    hover:bg-teal-50/60'    },
  { key: 'restaurants', href: '/restaurants',     label: 'Restaurantes',     icon: UtensilsCrossed, activeColor: 'text-rose-400',    activeBg: 'bg-rose-50',     hoverColor: 'hover:text-rose-400    hover:bg-rose-50/60'    },
  { key: 'wishlist',    href: '/wishlist',        label: 'Lista de deseos',  icon: Gift,            activeColor: 'text-pink-400',    activeBg: 'bg-pink-50',     hoverColor: 'hover:text-pink-400    hover:bg-pink-50/60'    },
  { key: 'health',      href: '/health',          label: 'Salud',            icon: HeartPulse,      activeColor: 'text-rose-400',    activeBg: 'bg-rose-50',     hoverColor: 'hover:text-rose-400    hover:bg-rose-50/60'    },
  { key: 'trips',       href: '/trips',           label: 'Viajes',           icon: Plane,           activeColor: 'text-violet-400',  activeBg: 'bg-violet-50',   hoverColor: 'hover:text-violet-400  hover:bg-violet-50/60'  },
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
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
          pathname === '/'
            ? 'bg-violet-100 text-violet-600'
            : 'text-slate-500 hover:bg-violet-50 hover:text-violet-500'
        }`}
      >
        <Home size={18} /> <span>Inicio</span>
      </Link>

      {visibleItems.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
              active
                ? `${item.activeBg} ${item.activeColor}`
                : `text-slate-500 ${item.hoverColor}`
            }`}
          >
            <Icon size={18} /> <span>{item.label}</span>
          </Link>
        )
      })}

      {isAdmin && (
        <Link
          href="/admin"
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
            pathname.startsWith('/admin')
              ? 'bg-violet-100 text-violet-600'
              : 'text-slate-500 hover:bg-violet-50 hover:text-violet-500'
          }`}
        >
          <Database size={18} /> <span>Administración</span>
        </Link>
      )}
    </>
  )
}

const Brand = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) =>
  size === 'lg' ? (
    <h2 className="text-2xl font-black tracking-tight text-slate-800">
      Family<span className="text-violet-400">Dashboard</span>
    </h2>
  ) : (
    <h2 className="text-xl font-black tracking-tight text-slate-800">
      Family<span className="text-violet-400">Dashboard</span>
    </h2>
  )

export default function AppNavigation({ permissions, isAdmin, displayName }: Props) {
  const [open, setOpen] = useState(false)

  const UserFooter = () => (
    <div className="p-4 border-t border-violet-100/60 space-y-1">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-black shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm font-bold text-slate-600 truncate">{displayName}</span>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors text-left"
        >
          <LogOut size={16} /> <span className="truncate">Cerrar Sesión</span>
        </button>
      </form>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white/80 border-r border-violet-100 shrink-0 backdrop-blur-sm">
        <div className="px-6 py-7">
          <Brand />
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <NavLinks permissions={permissions} isAdmin={isAdmin} />
        </nav>
        <UserFooter />
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[199] bg-white/90 backdrop-blur-sm border-b border-violet-100 flex items-center px-4 h-14">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-violet-50 text-slate-500 -ml-2"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div className="ml-3">
          <Brand size="sm" />
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-[200]" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sliding sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-[201] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-violet-100">
          <Brand />
          <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-violet-50 text-slate-400">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks permissions={permissions} isAdmin={isAdmin} onClick={() => setOpen(false)} />
        </nav>
        <UserFooter />
      </div>
    </>
  )
}
