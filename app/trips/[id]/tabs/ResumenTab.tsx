'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { updateTrip, deleteTrip } from '../../actions'
import type { Trip, Transport, Accommodation, Activity, Expense } from '../TripDetail'

const STATUS_OPTIONS = [
  { value: 'wishlist',  label: 'Wishlist' },
  { value: 'planning',  label: 'Planificando' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Completado' },
]

const EMOJIS = ['✈️','🏖️','🏔️','🌴','🗺️','🏛️','🎭','🎿','🚢','🌊','🏕️','🗼','🌺','🍜','🎡','🌍']

export default function ResumenTab({
  trip, transport, accommodations, activities, expenses,
}: {
  trip: Trip; transport: Transport[]; accommodations: Accommodation[]
  activities: Activity[]; expenses: Expense[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle]       = useState(trip.title)
  const [destination, setDest]  = useState(trip.destination)
  const [country, setCountry]   = useState(trip.country ?? '')
  const [startDate, setStart]   = useState(trip.start_date ?? '')
  const [endDate, setEnd]       = useState(trip.end_date ?? '')
  const [status, setStatus]     = useState(trip.status)
  const [budget, setBudget]     = useState(trip.budget_total?.toString() ?? '')
  const [notes, setNotes]       = useState(trip.notes ?? '')
  const [emoji, setEmoji]       = useState(trip.cover_emoji ?? '✈️')

  const totalTransport     = transport.reduce((s, t) => s + (t.price ?? 0), 0)
  const totalAccommodation = accommodations.reduce((s, a) => s + (a.total_price ?? 0), 0)
  const totalActivities    = activities.reduce((s, a) => s + (a.price ?? 0), 0)
  const totalExpenses      = expenses.reduce((s, e) => s + e.amount, 0)
  const totalSpent         = totalTransport + totalAccommodation + totalActivities + totalExpenses
  const budgetNum          = parseFloat(budget) || 0
  const budgetPct          = budgetNum > 0 ? Math.min((totalSpent / budgetNum) * 100, 100) : 0

  const nights = startDate && endDate
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !destination.trim()) { setError('Título y destino son obligatorios'); return }
    setSaving(true); setError(null)
    const res = await updateTrip(trip.id, {
      title, destination, country: country || undefined,
      start_date: startDate || undefined, end_date: endDate || undefined,
      status, budget_total: budgetNum || undefined,
      notes: notes || undefined, cover_emoji: emoji,
    })
    setSaving(false)
    if (res?.error) setError(res.error)
    else startTransition(() => router.refresh())
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este viaje y todos sus datos?')) return
    setDeleting(true)
    startTransition(() => deleteTrip(trip.id))
  }

  return (
    <div className="space-y-8">
      {/* Cost summary */}
      {totalSpent > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumen de costes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Transporte',    value: totalTransport,     color: 'text-violet-600' },
              { label: 'Alojamiento',   value: totalAccommodation, color: 'text-blue-600' },
              { label: 'Actividades',   value: totalActivities,    color: 'text-amber-600' },
              { label: 'Gastos viaje',  value: totalExpenses,      color: 'text-rose-600' },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.value.toFixed(0)} €</p>
              </div>
            ))}
          </div>
          {budgetNum > 0 && (
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600">Total gastado: <span className="text-slate-900">{totalSpent.toFixed(0)} €</span></span>
                <span className="text-slate-400">Presupuesto: {budgetNum.toFixed(0)} €</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{budgetPct.toFixed(0)}% del presupuesto · quedan {Math.max(0, budgetNum - totalSpent).toFixed(0)} €</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Editar información</p>

        <div>
          <p className="text-xs font-bold text-slate-400 mb-2">Icono</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-slate-100 scale-110' : 'hover:bg-slate-50'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del viaje *"
            className="sm:col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <input value={destination} onChange={e => setDest(e.target.value)} placeholder="Destino *"
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <input value={country} onChange={e => setCountry(e.target.value)} placeholder="País"
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium pl-1">Fecha inicio</label>
            <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium pl-1">Fecha fin{nights !== null ? ` · ${nights} noches` : ''}</label>
            <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Presupuesto total (€)" min="0" step="10"
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notas generales del viaje..."
            rows={3}
            className="sm:col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400 resize-none" />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </form>
    </div>
  )
}
