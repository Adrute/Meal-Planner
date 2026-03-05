import { createClient } from '@/lib/supabase/server'
import MapWrapper from './MapWrapper'
import ActionMenu from './ActionMenu'

export const dynamic = 'force-dynamic'

export default async function RestaurantsMapPage() {
    const supabase = await createClient()

    // Limpiamos las reservas pasadas de la NUEVA tabla automáticamente
    const now = new Date().toISOString()
    await supabase.from('reservations').delete().lt('reservation_date', now)
    
    const { data: restaurants } = await supabase.from('restaurants').select('*, reservations(*)')
    const { data: lists } = await supabase.from('restaurant_lists').select('*').order('name')
    const { data: listItems } = await supabase.from('restaurant_list_items').select('*')

    return (
        <div className="relative w-full h-[calc(100vh-80px)] md:h-screen flex flex-col bg-slate-100">
            <MapWrapper restaurants={restaurants || []} />
            <ActionMenu lists={lists || []} listItems={listItems || []} restaurants={restaurants || []} />
        </div>
    )
}