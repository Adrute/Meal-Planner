'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, X, Plus } from 'lucide-react'
import { addReservation, cancelReservation } from '../actions'

export default function ReservationManager({ restaurantId, initialReservations }: { restaurantId: string, initialReservations: any[] }) {
  const [date, setDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!date) return
    startTransition(async () => {
      // TRUCO DE ZONA HORARIA: Convertimos la hora local al estándar UTC absoluto antes de enviarla
      const isoDate = new Date(date).toISOString() 
      await addReservation(restaurantId, isoDate)
      setDate('')
    })
  }

  const handleCancel = (id: string) => {
    startTransition(async () => {
      await cancelReservation(id)
    })
  }

  const sortedReservations = [...initialReservations].sort(
    (a, b) => new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime()
  )

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mt-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-lg font-black text-purple-900 flex items-center gap-2 mb-6">
        <CalendarDays className="text-purple-500" /> Próximas Reservas
      </h2>
      
      {sortedReservations.length > 0 ? (
        <div className="space-y-3 mb-6">
          {sortedReservations.map(res => {
            const dateObj = new Date(res.reservation_date)
            return (
              <div key={res.id} className="flex items-center justify-between bg-purple-50/50 p-4 rounded-2xl border border-purple-100 shadow-sm group">
                <div>
                  <span className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-0.5">Reserva confirmada</span>
                  <span className="text-sm font-bold text-purple-900 capitalize">
                    {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button onClick={() => handleCancel(res.id)} disabled={isPending} className="text-purple-300 hover:text-rose-500 hover:bg-white p-2 rounded-xl transition-colors disabled:opacity-50 shadow-sm" title="Cancelar Reserva">
                  <X size={18} />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm text-slate-500 font-medium">No hay reservas futuras para este local.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
        <input 
          type="datetime-local" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-slate-700 bg-slate-50 text-sm font-bold transition-colors"
        />
        <button onClick={handleAdd} disabled={!date || isPending} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:bg-purple-200 disabled:text-purple-400 flex items-center justify-center gap-2 shadow-sm">
          {isPending ? 'Guardando...' : <><Plus size={18} /> Añadir Reserva</>}
        </button>
      </div>
    </div>
  )
}