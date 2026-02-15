'use client'

import { useState } from 'react'
import { addItem, toggleItem, deleteItem, importWeekIngredients, clearList } from './actions'
import { Plus, Trash2, Check, ShoppingBag, Loader2, Sparkles, Eraser } from 'lucide-react'

export default function ShoppingListClient({ initialItems }: { initialItems: any[] }) {
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(false)

  const pending = initialItems.filter(i => !i.checked)
  const completed = initialItems.filter(i => i.checked)

  const handleImport = async () => {
    setLoading(true)
    const res = await importWeekIngredients()
    setLoading(false)
    if (res.error) alert(res.error)
    else alert(`¡Listo! Se han añadido ${res.count} ingredientes de tus recetas.`)
  }

  const handleClear = async () => {
    if(!confirm('¿Borrar toda la lista?')) return
    setLoading(true)
    await clearList()
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return
    setLoading(true)
    await addItem(newItem)
    setNewItem('')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      
      {/* BOTONES DE ACCIÓN RÁPIDA */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          onClick={handleImport}
          disabled={loading}
          className="flex-1 min-w-[200px] bg-emerald-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} />}
          Importar de la Semana
        </button>

        <button 
          onClick={handleClear}
          className="bg-white text-slate-400 p-4 rounded-2xl font-bold border border-slate-200 hover:text-red-500 hover:border-red-100 transition-all flex items-center gap-2"
          title="Limpiar lista"
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* INPUT AÑADIR (Igual que antes pero con estilo refinado) */}
      <form onSubmit={handleAdd} className="relative group">
        <input
          type="text"
          placeholder="Añadir extra (Leche, pan...)"
          className="w-full p-4 pl-5 pr-14 rounded-2xl border-2 border-slate-100 bg-white font-medium focus:border-emerald-400 outline-none transition-all"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">
          <Plus size={24} />
        </button>
      </form>

      {/* LISTADO (Igual que antes) */}
      <div className="space-y-3 pt-4">
        {pending.map(item => (
          <ListItem key={item.id} item={item} />
        ))}
        {pending.length === 0 && completed.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
             <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-medium">Pulsa el botón verde para <br/> traer los ingredientes de tus recetas.</p>
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div className="pt-8 opacity-50">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Ya en el carrito</h3>
           <div className="space-y-2">
             {completed.map(item => (
               <ListItem key={item.id} item={item} />
             ))}
           </div>
        </div>
      )}
    </div>
  )
}

function ListItem({ item }: { item: any }) {
  const [loading, setLoading] = useState(false)
  const handleToggle = async () => {
    setLoading(true)
    await toggleItem(item.id, !item.checked)
    setLoading(false)
  }
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.checked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 shadow-sm'}`}>
      <button 
        onClick={handleToggle} 
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}
      >
        {item.checked && <Check size={14} strokeWidth={4} />}
      </button>
      <span className={`flex-1 font-bold ${item.checked ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
        {item.name}
      </span>
      <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
        <Trash2 size={18} />
      </button>
    </div>
  )
}