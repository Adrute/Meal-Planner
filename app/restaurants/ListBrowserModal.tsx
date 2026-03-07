'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark, X, ExternalLink, Trash2, Loader2, List as ListIcon } from 'lucide-react'
import Link from 'next/link'
import { deleteList } from './actions'

export default function ListBrowserModal({ 
    lists, 
    listItems, 
    restaurants 
}: { 
    lists: any[], 
    listItems: any[], 
    restaurants: any[] 
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeListId, setActiveListId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Función para borrar la lista con confirmación y spinner
    const handleDelete = (listId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Evitamos que al hacer clic en la papelera se "seleccione" la lista
        if (!confirm('¿Seguro que quieres borrar esta lista y vaciar su contenido para siempre?')) return
        
        setDeletingId(listId)
        startTransition(async () => {
            await deleteList(listId)
            setDeletingId(null)
            if (activeListId === listId) setActiveListId(null) // Si estábamos viendo la lista borrada, la cerramos
        })
    }

    const activeList = lists.find(l => l.id === activeListId)
    const activeRestaurantIds = listItems.filter(item => item.list_id === activeListId).map(item => item.restaurant_id)
    const activeRestaurants = restaurants.filter(r => activeRestaurantIds.includes(r.id))

    const modalContent = isOpen ? (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            <div className="relative w-full md:w-[450px] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
                
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Bookmark className="text-blue-500"/> Mis Listas
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 flex flex-col gap-6">
                    {/* Sección de carpetas/listas */}
                    <div className="grid grid-cols-2 gap-3">
                        {lists.length === 0 && <p className="text-sm font-bold text-slate-400 col-span-2 text-center py-8">No tienes listas creadas.</p>}
                        
                        {lists.map(list => (
                            <div 
                                key={list.id} 
                                onClick={() => setActiveListId(list.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-3 relative group ${activeListId === list.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <ListIcon size={18} className={activeListId === list.id ? 'text-blue-500' : 'text-slate-400'} />
                                    <button 
                                        onClick={(e) => handleDelete(list.id, e)}
                                        disabled={isPending}
                                        title="Borrar lista"
                                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    >
                                        {deletingId === list.id ? <Loader2 size={16} className="animate-spin text-rose-400" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                                <span className={`font-bold text-sm truncate ${activeListId === list.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                    {list.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Sección de contenido de la lista seleccionada */}
                    {activeList && (
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                Guardados en: <span className="text-blue-600">{activeList.name}</span>
                            </h3>
                            <div className="flex flex-col gap-3">
                                {activeRestaurants.length === 0 && <p className="text-xs font-bold text-slate-400 italic py-2">Esta lista está vacía.</p>}
                                {activeRestaurants.map(rest => (
                                    <Link key={rest.id} href={`/restaurants/${rest.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 transition-colors group">
                                        <div className="min-w-0 pr-4">
                                            <p className="font-bold text-sm text-slate-700 group-hover:text-blue-700 truncate">{rest.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{rest.food_type}</p>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    ) : null

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full">
                Mis Listas <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Bookmark size={16} /></div>
            </button>
            {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
        </>
    )
}