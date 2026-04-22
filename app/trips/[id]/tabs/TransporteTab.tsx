'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Plane, Train, Bus, Car, Ship, Truck, ChevronRight } from 'lucide-react'
import { addTransport, deleteTransport } from '../../actions'
import type { Trip, Transport } from '../TripDetail'

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  flight: { label: 'Vuelo',    Icon: Plane,  color: 'text-violet-600 bg-violet-50' },
  train:  { label: 'Tren',     Icon: Train,  color: 'text-blue-600 bg-blue-50' },
  bus:    { label: 'Autobús',  Icon: Bus,    color: 'text-amber-600 bg-amber-50' },
  car:    { label: 'Coche',    Icon: Car,    color: 'text-slate-600 bg-slate-100' },
  ferry:  { label: 'Ferry',    Icon: Ship,   color: 'text-cyan-600 bg-cyan-50' },
  other:  { label: 'Otro',     Icon: Truck,  color: 'text-rose-600 bg-rose-50' },
}

function fmt(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function TransporteTab({ trip, transport }: { trip: Trip; transport: Transport[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [type, setType]             = useState('flight')
  const [origin, setOrigin]         = useState('')
  const [destination, setDest]      = useState('')
  const [departureAt, setDepartAt]  = useState('')
  const [arrivalAt, setArrivalAt]   = useState('')
  const [carrier, setCarrier]       = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [price, setPrice]           = useState('')
  const [notes, setNotes]           = useState('')

  const resetForm = () => {
    setOrigin(''); setDest(''); setDepartAt(''); setArrivalAt('')
    setCarrier(''); setBookingRef(''); setPrice(''); setNotes('')
    setType('flight'); setShowForm(false); setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) { setError('Origen y destino son obligatorios'); return }
    setSaving(true); setError(null)
    const res = await addTransport(trip.id, {
      type, origin, destination,
      departure_at: departureAt || undefined, arrival_at: arrivalAt || undefined,
      carrier: carrier || undefined, booking_ref: bookingRef || undefined,
      price: price ? parseFloat(price) : undefined, notes: notes || undefined,
    })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    resetForm()
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteTransport(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      {transport.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <Plane size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Sin segmentos de transporte</p>
          <p className="text-sm mt-1">Añade vuelos, trenes o transfers</p>
        </div>
      )}

      {transport.map(t => {
        const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.other
        const Icon = cfg.Icon
        return (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-4 group">
            <div className={`p-3 rounded-2xl shrink-0 ${cfg.color}`}><Icon size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cfg.label}</span>
                {t.booking_ref && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t.booking_ref}</span>}
                {t.price && <span className="ml-auto text-sm font-black text-slate-700">{t.price.toFixed(0)} €</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <span>{t.origin}</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span>{t.destination}</span>
              </div>
              {t.carrier && <p className="text-xs text-slate-400 mt-0.5">{t.carrier}</p>}
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                {t.departure_at && <span>Salida: <b>{fmt(t.departure_at)}</b></span>}
                {t.arrival_at   && <span>Llegada: <b>{fmt(t.arrival_at)}</b></span>}
              </div>
              {t.notes && <p className="text-xs text-slate-400 italic mt-1">{t.notes}</p>}
            </div>
            <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0 self-start">
              {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        )
      })}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-violet-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nuevo segmento</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${type === k ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origen *"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input value={destination} onChange={e => setDest(e.target.value)} placeholder="Destino *"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Salida</label>
              <input type="datetime-local" value={departureAt} onChange={e => setDepartAt(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Llegada</label>
              <input type="datetime-local" value={arrivalAt} onChange={e => setArrivalAt(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            </div>
            <input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="Compañía"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="Localizador / Ref."
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Precio (€)" min="0" step="0.01"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Guardando...' : 'Añadir segmento'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-violet-300 text-slate-400 hover:text-violet-600 font-bold py-4 rounded-2xl text-sm transition-colors">
          <Plus size={16} /> Añadir segmento
        </button>
      )}
    </div>
  )
}
