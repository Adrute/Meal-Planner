import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Edit3, Navigation, Star, UtensilsCrossed, Trash2, Globe } from 'lucide-react'
import ListManager from './ListManager'
import SubmitButton from '@/components/SubmitButton'
import { deleteRestaurant } from '../actions'
import ReservationManager from './ReservationManager'

export const dynamic = 'force-dynamic'

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: rest } = await supabase.from('restaurants').select('*').eq('id', id).single()
  if (!rest) redirect('/restaurants')

  const { data: reservations } = await supabase.from('reservations').select('*').eq('restaurant_id', id)
  const { data: allLists } = await supabase.from('restaurant_lists').select('*').order('name')
  const { data: activeLists } = await supabase.from('restaurant_list_items').select('list_id').eq('restaurant_id', id)
  const activeListIds = activeLists?.map(l => l.list_id) || []

  const { data: tagColors } = await supabase.from('tag_colors').select('*')
  const tagColorsMap = Object.fromEntries(tagColors?.map(t => [t.tag, t.color]) || [])

  let status = rest.status; if(status === 'visited' || status === 'approved') status = 'liked';
  
  // Seguro de vida para el enlace
  const validWebsite = rest.website ? (rest.website.startsWith('http') ? rest.website : `https://${rest.website}`) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in pb-24">
      
      <div className="flex items-center justify-between mb-8">
        <Link href="/restaurants" className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex gap-2">
          <Link href={`/restaurants/${rest.id}/edit`} className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors border border-slate-100">
            <Edit3 size={20} />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {rest.is_favorite && <div className="absolute top-0 right-8 bg-amber-400 text-white px-4 py-2 rounded-b-xl font-black text-xs shadow-md flex items-center gap-1"><Star size={14} fill="currentColor"/> FAVORITO</div>}
        
        <h1 className="text-3xl font-black text-slate-800 mb-2 pr-24">{rest.name}</h1>
        
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
            <UtensilsCrossed size={14}/> {rest.food_type || 'Otro'}
          </span>
          
          {status === 'liked' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">Me gusta</span>}
          {status === 'pending' && <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold">Pendiente</span>}
          {status === 'doubtful' && <span className="bg-violet-50 text-violet-600 border border-violet-200 px-3 py-1.5 rounded-lg text-xs font-bold">En duda</span>}
          {status === 'rejected' && <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold">Descartado</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><MapPin size={14}/> Ubicación</h3>
              <a href={`https://maps.apple.com/?daddr=${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Abrir en Mapas</span>
                <Navigation size={16} className="text-slate-400 group-hover:text-blue-500" />
              </a>
            </div>

            {/* BLOQUE DE LA WEB ASEGURADO */}
            {validWebsite && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Globe size={14}/> Sitio Web Oficial</h3>
                <a href={validWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 truncate pr-4">{rest.website.replace(/^https?:\/\//, '')}</span>
                  <Globe size={16} className="text-slate-400 group-hover:text-emerald-500 shrink-0" />
                </a>
              </div>
            )}

            {rest.comments && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notas</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">{rest.comments}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {rest.allergens?.length > 0 ? rest.allergens.map((tag: string) => (
                  <span key={tag} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${tagColorsMap[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {tag}
                  </span>
                )) : <span className="text-sm text-slate-400 font-medium">Sin etiquetas</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <form action={deleteRestaurant}>
            <input type="hidden" name="id" value={rest.id} />
            <SubmitButton loadingText="Borrando..." className="text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-6 py-2.5 rounded-xl">
              <Trash2 size={16} /> Eliminar Local
            </SubmitButton>
          </form>
        </div>
      </div>

      <ReservationManager restaurantId={rest.id} initialReservations={reservations || []} />
      <ListManager restaurantId={rest.id} allLists={allLists || []} activeListIds={activeListIds} />
    </div>
  )
}