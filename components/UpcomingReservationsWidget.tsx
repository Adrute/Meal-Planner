import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarClock, MapPin, Plane } from 'lucide-react'

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  wishlist:  { label: 'Deseos',       color: 'text-slate-500',   bg: 'bg-slate-100'  },
  planning:  { label: 'Planificando', color: 'text-amber-700',   bg: 'bg-amber-100'  },
  confirmed: { label: 'Confirmados',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  completed: { label: 'Completados',  color: 'text-slate-400',   bg: 'bg-slate-100'  },
}

export default async function UpcomingReservationsWidget() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  const [{ data: reservations }, { data: allTrips }] = await Promise.all([
    supabase
      .from('reservations')
      .select('*, restaurant:restaurants(id, name)')
      .gte('reservation_date', now)
      .order('reservation_date', { ascending: true })
      .limit(3),
    supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date, cover_emoji, status'),
  ])

  // Next trip: nearest by start_date that hasn't ended, any status except completed
  const nextTrip = (allTrips || [])
    .filter(t => t.status !== 'completed' && t.end_date >= today)
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))[0] ?? null

  // Counts by status (excluding completed)
  const statusCounts = ['wishlist', 'planning', 'confirmed'].map(s => ({
    key: s,
    count: (allTrips || []).filter(t => t.status === s).length,
  })).filter(s => s.count > 0)

  const hasReservations = reservations && reservations.length > 0

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

          {nextTrip ? (
            <>
              {/* Next trip card */}
              {(() => {
                const isOngoing = nextTrip.start_date <= today && nextTrip.end_date >= today
                const cfg = STATUS_CONFIG[nextTrip.status]
                return (
                  <Link
                    href={`/trips/${nextTrip.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50 border border-violet-200 hover:bg-violet-100/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white border border-violet-200 flex items-center justify-center shadow-sm text-xl shrink-0">
                      {nextTrip.cover_emoji || '✈️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-violet-700 transition-colors truncate">
                        {nextTrip.title || nextTrip.destination}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {isOngoing
                          ? <span className="text-emerald-600 font-bold">En curso ·&nbsp;</span>
                          : nextTrip.start_date ? `${fmtDate(nextTrip.start_date + 'T12:00:00')} · ` : ''}
                        {cfg && <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label.replace(/s$/, '')}</span>}
                      </p>
                    </div>
                  </Link>
                )
              })()}

              {/* Status budget counters */}
              {statusCounts.length > 0 && (
                <div className="flex gap-2 mt-1">
                  {statusCounts.map(({ key, count }) => {
                    const cfg = STATUS_CONFIG[key]
                    return (
                      <div key={key} className={`flex-1 rounded-xl px-3 py-2 ${cfg.bg}`}>
                        <p className={`text-lg font-black ${cfg.color}`}>{count}</p>
                        <p className={`text-[10px] font-bold ${cfg.color} opacity-80`}>{cfg.label}</p>
                      </div>
                    )
                  })}
                </div>
              )}

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
