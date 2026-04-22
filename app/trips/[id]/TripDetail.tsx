'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Plane, Hotel, CalendarDays, MapPin, Receipt, CheckSquare } from 'lucide-react'
import ResumenTab from './tabs/ResumenTab'
import TransporteTab from './tabs/TransporteTab'
import AlojamientoTab from './tabs/AlojamientoTab'
import ItinerarioTab from './tabs/ItinerarioTab'
import LugaresTab from './tabs/LugaresTab'
import GastosTab from './tabs/GastosTab'
import ChecklistTab from './tabs/ChecklistTab'

export type Trip = {
  id: string; title: string; destination: string; country: string | null
  start_date: string | null; end_date: string | null; status: string
  notes: string | null; budget_total: number | null; cover_emoji: string | null
}
export type Transport = {
  id: string; trip_id: string; type: string; origin: string; destination: string
  departure_at: string | null; arrival_at: string | null; booking_ref: string | null
  carrier: string | null; price: number | null; notes: string | null
}
export type Accommodation = {
  id: string; trip_id: string; name: string; address: string | null
  check_in: string | null; check_out: string | null; total_price: number | null
  booking_ref: string | null; url: string | null; notes: string | null
}
export type Activity = {
  id: string; trip_id: string; date: string; start_time: string | null
  title: string; description: string | null; location: string | null
  price: number | null; confirmed: boolean; notes: string | null
}
export type Poi = {
  id: string; trip_id: string; name: string; lat: number | null; lon: number | null
  osm_id: string | null; category: string | null; address: string | null
  notes: string | null; visited: boolean
}
export type Expense = {
  id: string; trip_id: string; date: string | null; description: string
  amount: number; category: string; notes: string | null
}
export type ChecklistItem = {
  id: string; trip_id: string; item: string; checked: boolean; category: string
}

const TABS = [
  { key: 'resumen',     label: 'Resumen',     icon: LayoutDashboard },
  { key: 'transporte',  label: 'Transporte',  icon: Plane },
  { key: 'alojamiento', label: 'Alojamiento', icon: Hotel },
  { key: 'itinerario',  label: 'Itinerario',  icon: CalendarDays },
  { key: 'lugares',     label: 'Lugares',     icon: MapPin },
  { key: 'gastos',      label: 'Gastos',      icon: Receipt },
  { key: 'checklist',   label: 'Checklist',   icon: CheckSquare },
]

export default function TripDetail({
  trip, transport, accommodations, activities, pois, expenses, checklist,
}: {
  trip: Trip; transport: Transport[]; accommodations: Accommodation[]
  activities: Activity[]; pois: Poi[]; expenses: Expense[]; checklist: ChecklistItem[]
}) {
  const [activeTab, setActiveTab] = useState('resumen')

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="space-y-3">
        <Link href="/trips" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Viajes
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{trip.cover_emoji ?? '✈️'}</span>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{trip.title}</h1>
            <p className="text-slate-500 font-medium">{trip.destination}{trip.country ? `, ${trip.country}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}>
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'resumen'     && <ResumenTab     trip={trip} transport={transport} accommodations={accommodations} activities={activities} expenses={expenses} />}
        {activeTab === 'transporte'  && <TransporteTab  trip={trip} transport={transport} />}
        {activeTab === 'alojamiento' && <AlojamientoTab trip={trip} accommodations={accommodations} />}
        {activeTab === 'itinerario'  && <ItinerarioTab  trip={trip} activities={activities} />}
        {activeTab === 'lugares'     && <LugaresTab     trip={trip} pois={pois} />}
        {activeTab === 'gastos'      && <GastosTab      trip={trip} expenses={expenses} />}
        {activeTab === 'checklist'   && <ChecklistTab   trip={trip} checklist={checklist} />}
      </div>
    </div>
  )
}
