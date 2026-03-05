import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Star, UtensilsCrossed, Clock, CheckCircle2, Trash2, CalendarDays, Edit3, XCircle } from 'lucide-react'
import { deleteRestaurant } from '../actions'
import ListManager from './ListManager'

export const dynamic = 'force-dynamic'

import ReservationManager from './ReservationManager' // <--- Añade esto en los imports

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: rest } = await supabase.from('restaurants').select('*').eq('id', id).single()
    if (!rest) redirect('/restaurants')

    // NUEVO: Traemos las reservas de este local
    const { data: reservations } = await supabase.from('reservations').select('*').eq('restaurant_id', id)

    const { data: allLists } = await supabase.from('restaurant_lists').select('*').order('name')
    const { data: activeLists } = await supabase.from('restaurant_list_items').select('list_id').eq('restaurant_id', id)
    const activeListIds = activeLists?.map(l => l.list_id) || []

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in pb-24">

            {/* CABECERA Y NAVEGACIÓN */}
            <div className="flex justify-between items-center mb-8">
                <Link href="/restaurants" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors">
                    <ArrowLeft size={16} /> Volver al Mapa
                </Link>

                <div className="flex items-center gap-2">
                    {/* Botón de Editar (Preparado para el siguiente paso) */}
                    <Link href={`/restaurants/${rest.id}/edit`} className="text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                        <Edit3 size={16} /> Editar
                    </Link>

                    {/* Botón de Borrar */}
                    <form action={deleteRestaurant}>
                        <input type="hidden" name="id" value={rest.id} />
                        <button type="submit" className="text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                            <Trash2 size={16} /> Eliminar
                        </button>
                    </form>
                </div>
            </div>

            {/* TARJETA PRINCIPAL DEL RESTAURANTE */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">

                {rest.is_favorite && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-white px-4 py-1.5 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                        <Star size={12} className="fill-white" /> Favorito
                    </div>
                )}

                <h1 className="text-3xl font-black text-slate-900 mb-2 mt-4 md:mt-0 pr-20">{rest.name}</h1>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <UtensilsCrossed size={14} /> {rest.food_type || 'Otro'}
                    </span>
                    {rest.status === 'approved' || rest.status === 'visited' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Aprobado</span>
                    ) : rest.status === 'rejected' ? (
                        <span className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><XCircle size={14} /> Descartado</span>
                    ) : (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={14} /> Pendiente</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">Notas Personales</h3>
                            <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed text-sm">
                                {rest.comments || 'No hay comentarios para este local.'}
                            </p>
                        </div>

                        {rest.allergens && rest.allergens.length > 0 && (
                            <div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Etiquetas / Alérgenos</h3>
                                <div className="flex flex-wrap gap-2">
                                    {rest.allergens.map((tag: string, i: number) => (
                                        <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">Navegación</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <a href={`https://maps.apple.com/?daddr=${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                                <MapPin size={20} />
                                <span className="text-xs font-bold">Apple Maps</span>
                            </a>
                            <a href={`https://waze.com/ul?ll=${rest.lat},${rest.lng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                                <MapPin size={20} />
                                <span className="text-xs font-bold">Waze</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div> {/* <-- Fin de la tarjeta principal */}

            {/* NUEVO GESTOR DE RESERVAS INTERACTIVO */}
            <ReservationManager restaurantId={rest.id} initialReservations={reservations || []} />

            {/* GESTOR DE LISTAS */}
            <ListManager restaurantId={rest.id} allLists={allLists || []} activeListIds={activeListIds} />

        </div>
    )
}