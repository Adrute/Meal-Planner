'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, CalendarDays, MapPin, CheckCircle2, Circle } from 'lucide-react'
import { addActivity, toggleActivityConfirmed, deleteActivity } from '../../actions'
import type { Trip, Activity } from '../TripDetail'

function fmtDay(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

export default function ItinerarioTab({ trip, activities }: { trip: Trip; activities: Activity[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate]           = useState(trip.start_date ?? '')
  const [startTime, setStartTime] = useState('')
  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [location, setLocation]   = useState('')
  const [price, setPrice]         = useState('')
  const [notes, setNotes]         = useState('')

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})
  const days = Object.keys(grouped).sort()

  const resetForm = () => {
    setTitle(''); setDesc(''); setLocation(''); setPrice(''); setNotes('')
    setStartTime(''); setShowForm(false); setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !title.trim()) { setError('Fecha y título son obligatorios'); return }
    setSaving(true); setError(null)
    const res = await addActivity(trip.id, {
      date, title, start_time: startTime || undefined,
      description: description || undefined, location: location || undefined,
      price: price ? parseFloat(price) : undefined, notes: notes || undefined,
    })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    resetForm()
    startTransition(() => router.refresh())
  }

  const handleToggle = async (id: string, confirmed: boolean) => {
    setTogglingId(id)
    await toggleActivityConfirmed(id, !confirmed, trip.id)
    setTogglingId(null)
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteActivity(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {activities.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Sin actividades planificadas</p>
          <p className="text-sm mt-1">Organiza tu itinerario día a día</p>
        </div>
      )}

      {days.map(day => (
        <div key={day}>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 capitalize">
            {fmtDay(day)}
          </h3>
          <div className="space-y-2">
            {grouped[day].map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 group">
                <button onClick={() => handleToggle(a.id, a.confirmed)} disabled={togglingId === a.id}
                  className="shrink-0 mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors">
                  {togglingId === a.id
                    ? <Loader2 size={18} className="animate-spin" />
                    : a.confirmed
                      ? <CheckCircle2 size={18} className="text-emerald-500" />
                      : <Circle size={18} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.start_time && <span className="text-xs font-black text-violet-600 shrink-0">{a.start_time.slice(0, 5)}</span>}
                    <span className={`font-bold text-slate-800 ${a.confirmed ? '' : 'opacity-70'}`}>{a.title}</span>
                    {a.price && <span className="ml-auto text-xs font-black text-slate-500 shrink-0">{a.price.toFixed(0)} €</span>}
                  </div>
                  {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                  {a.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {a.location}
                    </p>
                  )}
                  {a.notes && <p className="text-xs text-slate-400 italic mt-0.5">{a.notes}</p>}
                </div>
                <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0 self-start">
                  {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nueva actividad</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Día *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Hora (opcional)</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título *"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Lugar"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Precio (€)" min="0" step="0.01"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Descripción"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Guardando...' : 'Añadir actividad'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-amber-300 text-slate-400 hover:text-amber-600 font-bold py-4 rounded-2xl text-sm transition-colors">
          <Plus size={16} /> Añadir actividad
        </button>
      )}
    </div>
  )
}
