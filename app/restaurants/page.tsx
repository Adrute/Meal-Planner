import { createClient } from '@/lib/supabase/server'
import MapWrapper from './MapWrapper'
import ActionMenu from './ActionMenu'

export const dynamic = 'force-dynamic'

export default async function RestaurantsMapPage() {
  const supabase = await createClient()

  // Limpieza de reservas pasadas
  const now = new Date().toISOString()
  await supabase.from('reservations').delete().lt('reservation_date', now) 

  const { data: restaurants } = await supabase.from('restaurants').select('*, reservations(*)')
  const { data: lists } = await supabase.from('restaurant_lists').select('*').order('name')
  const { data: listItems } = await supabase.from('restaurant_list_items').select('*')
  const { data: tagColors } = await supabase.from('tag_colors').select('*')
  
  const tagColorsMap = Object.fromEntries(tagColors?.map(t => [t.tag, t.color]) || [])

  // TRADUCCIÓN DE ESTADOS ANTIGUOS PARA QUE NO DESAPAREZCAN
  const mappedRestaurants = restaurants?.map(r => {
    let st = r.status
    if (st === 'visited' || st === 'approved') st = 'liked'
    return { ...r, status: st }
  }) || []

  return (
    <div className="relative w-full h-[calc(100vh-80px)] md:h-screen flex flex-col bg-slate-100">
      <MapWrapper restaurants={mappedRestaurants} tagColorsMap={tagColorsMap} />
      <ActionMenu lists={lists || []} listItems={listItems || []} restaurants={mappedRestaurants} tagColorsMap={tagColorsMap} />
    </div>
  )
}