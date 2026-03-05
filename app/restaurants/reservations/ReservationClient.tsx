'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, CalendarDays, MessageCircle, Edit3, Check, X } from 'lucide-react'
import { updateRestaurant } from '../actions'

// Formatea la fecha UTC para que el input type="datetime-local" la entienda sin sumarle ni restarle horas
const toLocalDatetimeInput = (isoString: string) => {
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ReservationClient({ initialReservations }: { initialReservations: any[] }) {
  const [reservations, setReservations] = useState(initialReservations)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')

  const handleShareWhatsApp = (rest: any, dateObj: Date) => {
    const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })
    const mapsLink = `https://maps.apple.com/?daddr=${rest.lat},${rest.lng}`
    const text = `🍽️ *¡Reserva Confirmada!*\n\n📍 *${rest.name}*\n📅 ${dateStr}\n⏰ ${timeStr}\n\n🗺️ Cómo llegar:\n${mapsLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><CalendarDays size={32} className="text-slate-300" /></div>
        <h3 className="text-lg font-black text-slate-700">Sin reservas a la vista</h3>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reservations.map(res => {
        const rest = res.restaurant
        const date = new Date(res.reservation_date)
        const isEditing = editingId === res.id

        return (
          <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-purple-400"></div>
            <div className="pl-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-black text-slate-800">{rest.name}</h3>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="datetime-local" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        min={new Date().toISOString().slice(0, 16)} 
                        className="px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-bold text-slate-700 outline-none"
                      />
                      <button onClick={async () => {
                        const { updateReservationDate } = await import('../actions')
                        const isoEditDate = new Date(editDate).toISOString() // Asegura UTC exacto
                        await updateReservationDate(res.id, isoEditDate)
                        setReservations(prev => prev.map(r => r.id === res.id ? { ...r, reservation_date: isoEditDate } : r))
                        setEditingId(null)
                      }} className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Check size={16}/></button>
                      <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-600 p-1.5 rounded-lg"><X size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/edit">
                      <p className="text-purple-600 font-bold mt-1 text-sm capitalize">
                        {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })}
                      </p>
                      <button 
                        onClick={() => { setEditingId(res.id); setEditDate(toLocalDatetimeInput(res.reservation_date)) }} 
                        className="text-slate-300 hover:text-purple-500 mt-1 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <Link href={`/restaurants/${rest.id}`} className="p-2 text-slate-400 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded-xl transition-colors"><ExternalLink size={18} /></Link>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => handleShareWhatsApp(rest, date)} className="flex-1 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 shadow-sm hover:bg-green-100 transition-colors">
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button 
                  onClick={async () => {
                    const { cancelReservation } = await import('../actions')
                    await cancelReservation(res.id)
                    setReservations(prev => prev.filter(r => r.id !== res.id))
                  }} 
                  className="bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2.5 rounded-xl font-bold hover:bg-rose-100 transition-colors"
                  title="Cancelar Reserva"
                ><X size={16} /></button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}