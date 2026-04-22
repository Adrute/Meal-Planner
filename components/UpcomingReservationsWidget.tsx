import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarClock, MapPin, Plane } from 'lucide-react'

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_COLORS: Record<string, string> = {
  wishlist:  'bg-slate-100 text-slate-500',
  planning:  'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  wishlist:  'Deseo',
  planning:  'Planificando',
  confirmed: 'Confirmado',
  completed: 'Completado',
}

export default async function UpcomingReservationsWidget() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  const [{ data: reservations }, { data: trips }] = await Promise.all([
    supabase
      .from('reservations')
      .select('*, restaurant:restaurants(id, name)')
      .gte('reservation_date', now)
      .order('reservation_date', { ascending: true })
      .limit(3),
    supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date, emoji, status')
      .eq('status', 'confirmed')
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(3),
  ])

  const hasReservations = reservations && reservations.length > 0
  const hasTrips = trips && trips.length > 0

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col h-full">
      <h2 className="text-lg font-black text-slate-800 mb-6">Próximos Planes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">

        {/* --- Reservas --- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock size={14} className="text-purple-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Reservas</span>
          </div>

          {hasReservations ? (
            <>
              {reservations!.map(res => {
                const dateObj = new Date(res.reservation_date)
                return (
                  <Link
                    key={res.id}
                    href={`/restaurants/${res.restaurant.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400 group-hover:text-purple-500 group-hover:border-purple-200 transition-colors shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors truncate">
                        {res.restaurant.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                        {fmtDate(dateObj)} · {fmtTime(dateObj)}
                      </p>
                    </div>
                  </Link>
                )
              })}
              <Link href="/restaurants/reservations" className="text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors text-center mt-auto pt-1">
                Ver todas →
              </Link>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
              <CalendarClock size={28} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">Sin reservas</p>
              <p className="text-xs mt-0.5">No hay restaurantes próximos</p>
            </div>
          )}
        </div>

        {/* --- Viajes --- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Plane size={14} className="text-violet-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Viajes</span>
          </div>

          {hasTrips ? (
            <>
              {trips!.map(trip => {
                const isOngoing = trip.start_date && trip.start_date <= today && trip.end_date && trip.end_date >= today
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-lg shrink-0">
                      {trip.emoji || '✈️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-violet-700 transition-colors truncate">
                        {trip.title || trip.destination}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {isOngoing ? (
                          <span className="text-emerald-600 font-bold">En curso</span>
                        ) : trip.start_date ? (
                          fmtDate(trip.start_date + 'T12:00:00')
                        ) : ''}
                        {trip.status && (
                          <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[trip.status] ?? ''}`}>
                            {STATUS_LABELS[trip.status] ?? trip.status}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                )
              })}
              <Link href="/trips" className="text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors text-center mt-auto pt-1">
                Ver todos →
              </Link>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
              <Plane size={28} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">Sin viajes</p>
              <Link href="/trips" className="text-xs text-violet-500 font-bold hover:underline mt-1">
                Planifica uno →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
