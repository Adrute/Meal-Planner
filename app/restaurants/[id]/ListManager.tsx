'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Plus, Check } from 'lucide-react'
import { createList, toggleList } from '../actions'

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

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    const name = newListName.trim()
    setNewListName('') // Limpiamos el input rápido para buena UX
    startTransition(() => {
      createList(name)
    })
  }

  const handleToggle = (listId: string, currentlyActive: boolean) => {
    startTransition(() => {
      toggleList(restaurantId, listId, !currentlyActive)
    })
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mt-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
        <Bookmark className="text-emerald-500" /> Guardar en Listas
      </h2>

      {/* Cuadrícula de Listas Existentes */}
      {allLists && allLists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {allLists.map(list => {
            const isActive = activeListIds.includes(list.id)
            return (
              <button
                key={list.id}
                onClick={() => handleToggle(list.id, isActive)}
                disabled={isPending}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold transition-all text-left group ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-slate-400'}`}>
                  <Check size={12} />
                </div>
                <span className="truncate">{list.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Crear Nueva Lista */}
      <form onSubmit={handleAddList} className="flex gap-2 border-t border-slate-100 pt-6">
        <input
          type="text"
          placeholder="Crear nueva lista (ej: Pizzas Top)"
          value={newListName}
          onChange={e => setNewListName(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm text-slate-700"
        />
        <button 
          type="submit" 
          disabled={isPending || !newListName.trim()} 
          className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={16} /> Crear
        </button>
      </form>
    </div>
  )
}