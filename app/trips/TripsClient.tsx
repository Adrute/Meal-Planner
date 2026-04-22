'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Plane, MapPin, Calendar, Wallet, Loader2, X } from 'lucide-react'
import { createTrip } from './actions'

type Trip = {
  id: string; title: string; destination: string; country: string | null
  start_date: string | null; end_date: string | null; status: string
  notes: string | null; budget_total: number | null; cover_emoji: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  wishlist:  { label: 'Wishlist',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  planning:  { label: 'Planificando', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmado',  color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
  completed: { label: 'Completado',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
}

const EMOJIS = ['✈️','🏖️','🏔️','🌴','🗺️','🏛️','🎭','🎿','🚢','🌊','🏕️','🗼','🌺','🍜','🎡','🌍']

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'planning', label: 'Planificando' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'completed', label: 'Completado' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NewTripModal({ onClose }: { onClose: () => void }) {
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emoji, setEmoji] = useState('✈️')
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('wishlist')
  const [budget, setBudget] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !destination.trim()) { setError('Título y destino son obligatorios'); return }
    setSaving(true)
    startTransition(async () => {
      const res = await createTrip({
        title, destination, country: country || undefined,
        start_date: startDate || undefined, end_date: endDate || undefined,
        status, budget_total: budget ? parseFloat(budget) : undefined,
        cover_emoji: emoji,
      })
      if (res?.error) { setError(res.error); setSaving(false) }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">Nuevo viaje</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Icono</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-slate-100 scale-110' : 'hover:bg-slate-50'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del viaje *"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            </div>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destino *"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="País"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
              placeholder="Presupuesto (€)" min="0" step="10"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? 'Creando...' : 'Crear viaje'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function TripsClient({ trips }: { trips: Trip[] }) {
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 p-3 rounded-2xl text-violet-600"><Plane size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Viajes</h1>
            <p className="text-slate-500 font-medium">Organiza y planifica tus aventuras</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-colors shrink-0">
          <Plus size={16} /> Nuevo viaje
        </button>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === tab.key ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'}`}>
            {tab.label}
            <span className={`ml-2 text-xs ${filter === tab.key ? 'text-violet-200' : 'text-slate-400'}`}>
              {tab.key === 'all' ? trips.length : trips.filter(t => t.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Plane size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">No hay viajes aquí todavía</p>
          <p className="text-sm mt-1">Crea tu primer viaje para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => {
            const st = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.wishlist
            const nights = trip.start_date && trip.end_date
              ? Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000)
              : null
            return (
              <Link key={trip.id} href={`/trips/${trip.id}`}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">
                <div className="bg-gradient-to-br from-violet-50 to-slate-50 p-8 flex items-center justify-center">
                  <span className="text-6xl">{trip.cover_emoji ?? '✈️'}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-violet-600 transition-colors">{trip.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                        <MapPin size={12} />
                        <span className="text-xs font-medium">{trip.destination}{trip.country ? `, ${trip.country}` : ''}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {trip.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(trip.start_date)}
                        {nights !== null && ` · ${nights}n`}
                      </span>
                    )}
                    {trip.budget_total && (
                      <span className="flex items-center gap-1 ml-auto font-bold text-slate-600">
                        <Wallet size={11} />
                        {trip.budget_total.toLocaleString('es-ES')} €
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showNew && <NewTripModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
