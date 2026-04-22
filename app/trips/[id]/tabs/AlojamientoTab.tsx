'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Hotel, ExternalLink, Calendar } from 'lucide-react'
import { addAccommodation, deleteAccommodation } from '../../actions'
import type { Trip, Accommodation } from '../TripDetail'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nights(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return null
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
}

export default function AlojamientoTab({ trip, accommodations }: { trip: Trip; accommodations: Accommodation[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [name, setName]             = useState('')
  const [address, setAddress]       = useState('')
  const [checkIn, setCheckIn]       = useState('')
  const [checkOut, setCheckOut]     = useState('')
  const [price, setPrice]           = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [url, setUrl]               = useState('')
  const [notes, setNotes]           = useState('')

  const resetForm = () => {
    setName(''); setAddress(''); setCheckIn(''); setCheckOut('')
    setPrice(''); setBookingRef(''); setUrl(''); setNotes('')
    setShowForm(false); setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(null)
    const res = await addAccommodation(trip.id, {
      name, address: address || undefined, check_in: checkIn || undefined,
      check_out: checkOut || undefined, total_price: price ? parseFloat(price) : undefined,
      booking_ref: bookingRef || undefined, url: url || undefined, notes: notes || undefined,
    })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    resetForm()
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteAccommodation(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      {accommodations.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <Hotel size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Sin alojamientos</p>
          <p className="text-sm mt-1">Añade hoteles, apartamentos o Airbnbs</p>
        </div>
      )}

      {accommodations.map(a => {
        const n = nights(a.check_in, a.check_out)
        return (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-4 group">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl shrink-0"><Hotel size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800">{a.name}</h3>
                  {a.address && <p className="text-xs text-slate-400 mt-0.5">{a.address}</p>}
                </div>
                {a.total_price && <span className="text-sm font-black text-slate-700 shrink-0">{a.total_price.toFixed(0)} €</span>}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                {a.check_in && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {fmtDate(a.check_in)} → {fmtDate(a.check_out)}
                    {n !== null && <span className="font-bold text-slate-600">· {n}n</span>}
                  </span>
                )}
                {a.booking_ref && <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">{a.booking_ref}</span>}
              </div>
              {a.notes && <p className="text-xs text-slate-400 italic mt-1">{a.notes}</p>}
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                  <ExternalLink size={11} /> Ver reserva
                </a>
              )}
            </div>
            <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0 self-start">
              {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        )
      })}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nuevo alojamiento</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del alojamiento *"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Check-in</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium pl-1">Check-out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            </div>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Precio total (€)" min="0" step="0.01"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            <input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="Ref. de reserva"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL de la reserva"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Guardando...' : 'Añadir alojamiento'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-600 font-bold py-4 rounded-2xl text-sm transition-colors">
          <Plus size={16} /> Añadir alojamiento
        </button>
      )}
    </div>
  )
}
