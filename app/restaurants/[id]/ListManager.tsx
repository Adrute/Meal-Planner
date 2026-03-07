'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Plus, Check, Loader2, Trash2 } from 'lucide-react'
import { createList, toggleList } from '../actions'
import { deleteList } from '../actions' // Asegúrate de tener esta función en tu actions.ts

export default function ListManager({ 
  restaurantId, 
  allLists, 
  activeListIds 
}: { 
  restaurantId: string, 
  allLists: any[], 
  activeListIds: string[] 
}) {
  const [newListName, setNewListName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [activeLoadingId, setActiveLoadingId] = useState<string | null>(null)

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    const name = newListName.trim()
    setNewListName('')
    setActiveLoadingId('NEW')
    
    startTransition(async () => {
      await createList(name)
      setActiveLoadingId(null)
    })
  }

  const handleToggle = (listId: string, currentlyActive: boolean) => {
    setActiveLoadingId(listId)
    startTransition(async () => {
      await toggleList(restaurantId, listId, !currentlyActive)
      setActiveLoadingId(null)
    })
  }

  const handleDeleteList = (listId: string) => {
    if(!confirm('¿Seguro que quieres borrar esta lista para siempre?')) return
    setActiveLoadingId(listId)
    startTransition(async () => {
      await deleteList(listId)
      setActiveLoadingId(null)
    })
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mt-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
        <Bookmark className="text-emerald-500" /> Guardar en Listas
      </h2>

      {allLists && allLists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {allLists.map(list => {
            const isActive = activeListIds.includes(list.id)
            const isThisLoading = isPending && activeLoadingId === list.id

            return (
              // Cambiamos el <button> por un <div> interactivo para evitar el "Hydration Error"
              <div
                key={list.id}
                onClick={() => !isPending && handleToggle(list.id, isActive)}
                className={`cursor-pointer flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold transition-all text-left group/item ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover/item:border-slate-400'}`}>
                  {isThisLoading ? (
                    <Loader2 size={12} className="animate-spin text-current" />
                  ) : (
                    <Check size={12} />
                  )}
                </div>
                
                <div className="flex justify-between items-center w-full">
                  <span className="truncate pr-2">{list.name}</span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }} 
                    disabled={isPending}
                    className="text-slate-300 hover:text-rose-500 p-2 opacity-0 group-hover/item:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {isThisLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleAddList} className="flex gap-2 border-t border-slate-100 pt-6">
        <input
          type="text"
          placeholder="Crear nueva lista (ej: Pizzas Top)"
          value={newListName}
          onChange={e => setNewListName(e.target.value)}
          disabled={isPending}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm text-slate-700 disabled:opacity-60 bg-white"
        />
        <button 
          type="submit" 
          disabled={isPending || !newListName.trim()} 
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[110px]"
        >
          {isPending && activeLoadingId === 'NEW' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <><Plus size={16} /> Crear</>
          )}
        </button>
      </form>
    </div>
  )
}