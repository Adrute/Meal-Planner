'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, FolderHeart, ArrowLeft, UtensilsCrossed, Star, MapPin, ChevronRight, Bookmark } from 'lucide-react'
import Link from 'next/link'

export default function ListBrowserModal({ lists, listItems, restaurants }: { lists: any[], listItems: any[], restaurants: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [activeList, setActiveList] = useState<any | null>(null)

    useEffect(() => { setMounted(true) }, [])

    const handleOpen = () => {
        setActiveList(null)
        setIsOpen(true)
    }

    // 1. INYECTAMOS LA LISTA VIRTUAL DE FAVORITOS
    const virtualFavList = { id: 'FAV_VIRTUAL', name: 'Favoritos', icon: 'star' }
    const allLists = [virtualFavList, ...lists]

    // 2. FILTRAMOS DEPENDIENDO DE SI ES LA LISTA DE FAVORITOS O UNA NORMAL
    const restaurantsInActiveList = activeList?.id === 'FAV_VIRTUAL'
        ? restaurants.filter(rest => rest.is_favorite)
        : activeList
            ? restaurants.filter(rest => listItems.some(item => item.list_id === activeList.id && item.restaurant_id === rest.id))
            : []

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white shrink-0">
                    {activeList ? (
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveList(null)} className="p-2 -ml-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 m-0">
                                {activeList.id === 'FAV_VIRTUAL' ? <Star className="text-amber-400 fill-amber-400" /> : <FolderHeart className="text-emerald-500" />}
                                {activeList.name}
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 m-0">
                            <Bookmark className="text-emerald-500" /> Mis Listas
                        </h2>
                    )}
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">

                    {!activeList && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {allLists.map(list => {
                                // Calculamos cuántos hay en cada lista
                                const count = list.id === 'FAV_VIRTUAL'
                                    ? restaurants.filter(r => r.is_favorite).length
                                    : listItems.filter(item => item.list_id === list.id).length

                                const isFav = list.id === 'FAV_VIRTUAL'

                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => setActiveList(list)}
                                        className={`bg-white p-5 rounded-2xl border ${isFav ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/30' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'} shadow-sm transition-all text-left group`}
                                    >
                                        {isFav ? (
                                            <Star size={28} className="text-amber-400 fill-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <FolderHeart size={28} className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                                        )}
                                        <h3 className="font-bold text-slate-800 truncate">{list.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{count} sitios</p>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {activeList && (
                        <div className="space-y-3">
                            {restaurantsInActiveList.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
                                    Esta lista está vacía.
                                </div>
                            ) : (
                                restaurantsInActiveList.map(rest => (
                                    <Link key={rest.id} href={`/restaurants/${rest.id}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-800 text-base truncate">{rest.name}</h3>
                                                {rest.is_favorite && <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                                <span className="flex items-center gap-1"><UtensilsCrossed size={12} /> {rest.food_type || 'Otro'}</span>
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {rest.status === 'visited' ? 'Visitado' : 'Pendiente'}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shrink-0">
                                            <ChevronRight size={18} />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )

    return (
        <>
            <button
                onClick={handleOpen}
                className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full"
            >
                Mis Listas <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><Bookmark size={16} /></div>
            </button>
            {isOpen && mounted && createPortal(modalContent, document.body)}
        </>
    )
}