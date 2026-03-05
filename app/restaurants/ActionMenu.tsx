'use client'

import { useState } from 'react'
import { Plus, Table as TableIcon, CalendarClock } from 'lucide-react'
import Link from 'next/link'
import AddRestaurantModal from './AddRestaurantModal'
import ListBrowserModal from './ListBrowserModal'

export default function ActionMenu({ lists, listItems, restaurants }: { lists: any[], listItems: any[], restaurants: any[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[1000] flex flex-col items-end gap-3 pointer-events-none">

      {/* Opciones del menú desplegable */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isOpen ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-90 invisible pointer-events-none'}`}>
        <Link href="/restaurants/table" className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full">
          Tabla de Locales <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><TableIcon size={16} /></div>
        </Link>

        <Link href="/restaurants/reservations" className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full">
          Ver Reservas <div className="bg-purple-100 text-purple-600 p-2 rounded-full"><CalendarClock size={16} /></div>
        </Link>

        <ListBrowserModal lists={lists} listItems={listItems} restaurants={restaurants} />
        <AddRestaurantModal />
      </div>

      {/* Botón Principal (Gira al abrir) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl text-white transition-all duration-300 pointer-events-auto ${isOpen ? 'bg-slate-800 rotate-45' : 'bg-slate-900 hover:scale-105'}`}
      >
        <Plus size={28} />
      </button>

    </div>
  )
}