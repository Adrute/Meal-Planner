import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import ReservationClient from './ReservationClient'

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
    const supabase = await createClient()

    const now = new Date().toISOString()
    await supabase.from('restaurants').update({ reservation_date: null }).lt('reservation_date', now)

    // Traemos las reservas de la tabla nueva y conectamos los datos del restaurante asociado
    const { data: reservations } = await supabase
        .from('reservations')
        .select('*, restaurant:restaurants(*)')
        .order('reservation_date', { ascending: true })

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/restaurants" className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-colors border border-slate-100">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 m-0">
                        <CalendarClock className="text-purple-500" /> Próximas Reservas
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Tus planes gastronómicos confirmados.</p>
                </div>
            </div>

            <ReservationClient initialReservations={reservations || []} />
        </div>
    )
}