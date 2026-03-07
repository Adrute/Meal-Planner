import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarClock, MapPin, ChevronRight } from 'lucide-react'

export default async function UpcomingReservationsWidget() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  
  // Traemos las reservas futuras conectando con el nombre del restaurante
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, restaurant:restaurants(*)')
    .gte('reservation_date', now)
    .order('reservation_date', { ascending: true })
    .limit(4) // Pedimos hasta 4 para saber si hay "más" que mostrar

  // Estado vacío: Si no hay reservas
  if (!reservations || reservations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
           <CalendarClock className="text-purple-300" size={24} />
        </div>
        <h3 className="text-sm font-black text-slate-700 mb-1">Sin visitas a la vista</h3>
        <p className="text-xs text-slate-500 font-medium">No tienes reservas próximas programadas.</p>
      </div>
    )
  }

  // Cortamos a 3 para mostrar, y sabemos si hay más de 3
  const displayReservations = reservations.slice(0, 3)
  const hasMore = reservations.length > 3

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
      
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <CalendarClock className="text-purple-500" /> Próximas Visitas
        </h2>
        
        {/* Enlace de "Ver todas" si hay más de 3 */}
        {hasMore && (
          <Link href="/restaurants/reservations" className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg transition-colors">
            Ver todas <ChevronRight size={14} />
          </Link>
        )}
      </div>
      
      <div className="space-y-3 flex-1">
        {displayReservations.map(res => {
          const dateObj = new Date(res.reservation_date)
          return (
            <Link 
              key={res.id} 
              href={`/restaurants/${res.restaurant.id}`} 
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors group"
            >
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors truncate">
                  {res.restaurant.name}
                </p>
                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5 flex items-center gap-1">
                   {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} • {dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400 group-hover:text-purple-500 group-hover:border-purple-200 transition-colors shrink-0">
                <MapPin size={14} />
              </div>
            </Link>
          )
        })}
      </div>
      
      {/* Botón sutil debajo si caben en pantalla pero quieres ir al gestor */}
      {!hasMore && (
         <Link href="/restaurants/reservations" className="mt-5 block text-center text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors w-full">
            Ir al gestor de reservas
         </Link>
      )}
    </div>
  )
}