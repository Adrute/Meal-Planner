'use client'

import { useState } from 'react'
import { addItem, toggleItem, deleteItem, importWeekIngredients, clearList } from './actions'
import { Plus, Trash2, Check, ShoppingBag, Loader2, Sparkles, Eraser, Store, ChevronDown, Tags } from 'lucide-react'
import Link from 'next/link'

type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  is_manual: boolean
  store: string
}

export default function ShoppingListClient({
  initialItems,
  stores,
}: {
  initialItems: ShoppingItem[]
  stores: string[]
}) {
  const [newItem, setNewItem] = useState('')
  const [newItemStore, setNewItemStore] = useState(stores[0] || 'Sin tienda')
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const pending = initialItems.filter(i => !i.checked)
  const completed = initialItems.filter(i => i.checked)

  // Agrupar items pendientes por tienda
  const pendingByStore = pending.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const store = item.store || 'Sin tienda'
    if (!acc[store]) acc[store] = []
    acc[store].push(item)
    return acc
  }, {})

  // Tiendas ordenadas alfabéticamente, "Sin tienda" siempre al final
  const storeOrder = Object.keys(pendingByStore).sort((a, b) => {
    if (a === 'Sin tienda') return 1
    if (b === 'Sin tienda') return -1
    return a.localeCompare('es')
  })

  const handleImport = async () => {
    setIsImporting(true)
    const res = await importWeekIngredients()
    setIsImporting(false)
    if (res.error) alert(res.error)
    else alert(`¡Listo! Se han añadido ${res.count} ingredientes de tus recetas.`)
  }

  const handleClear = async () => {
    if (!confirm('¿Borrar toda la lista?')) return
    setIsClearing(true)
    await clearList()
    setIsClearing(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return
    setIsAdding(true)
    await addItem(newItem, newItemStore)
    setNewItem('')
    setIsAdding(false)
  }

  const isEmpty = pending.length === 0 && completed.length === 0

  return (
    <div className="space-y-6">

      {/* BOTONES DE ACCIÓN RÁPIDA */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleImport}
          disabled={isImporting || isClearing}
          className="flex-1 min-w-[200px] bg-emerald-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {isImporting ? 'Importando...' : 'Importar de la Semana'}
        </button>

        <Link
          href="/ingredients"
          className="bg-white text-slate-500 p-4 rounded-2xl font-bold border border-slate-200 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-2"
          title="Gestionar ingredientes"
        >
          <Tags size={20} />
        </Link>

        <button
          onClick={handleClear}
          disabled={isClearing || isImporting}
          className="bg-white text-slate-400 p-4 rounded-2xl font-bold border border-slate-200 hover:text-red-500 hover:border-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
          title="Limpiar lista"
        >
          {isClearing ? <Loader2 className="animate-spin" size={20} /> : <Eraser size={20} />}
        </button>
      </div>

      {/* FORMULARIO AÑADIR MANUAL */}
      <form onSubmit={handleAdd} className="flex gap-2 items-stretch">
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Añadir producto..."
            className="w-full p-4 pl-5 rounded-2xl border-2 border-slate-100 bg-white font-medium focus:border-emerald-400 outline-none transition-all"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          {/* Selector de tienda para item manual */}
          <div className="relative">
            <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={newItemStore}
              onChange={(e) => setNewItemStore(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:border-emerald-400 appearance-none cursor-pointer"
            >
              {stores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Sin tienda">Sin tienda</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          type="submit"
          disabled={isAdding}
          className="px-5 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 self-stretch"
        >
          {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={24} />}
        </button>
      </form>

      {/* LISTA VACÍA */}
      {isEmpty && (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">
            Pulsa el botón verde para <br /> traer los ingredientes de tus recetas.
          </p>
        </div>
      )}

      {/* ITEMS PENDIENTES AGRUPADOS POR TIENDA */}
      {storeOrder.length > 0 && (
        <div className="space-y-6">
          {storeOrder.map(store => (
            <StoreSection
              key={store}
              store={store}
              items={pendingByStore[store]}
            />
          ))}
        </div>
      )}

      {/* COMPLETADOS */}
      {completed.length > 0 && (
        <div className="pt-4 opacity-50">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">
            Ya en el carrito ({completed.length})
          </h3>
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

// === SECCIÓN DE TIENDA ===
function StoreSection({ store, items }: { store: string; items: ShoppingItem[] }) {
  const [collapsed, setCollapsed] = useState(false)

  const storeColors: Record<string, string> = {
    'Sin tienda': 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const colorClass = storeColors[store] ?? 'bg-emerald-50 text-emerald-700 border-emerald-100'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Cabecera de sección */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${colorClass}`}>
            <Store size={12} />
            {store}
          </span>
          <span className="text-sm font-bold text-slate-400">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
        />
      </button>

      {/* Items de la sección */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {items.map(item => (
            <ListItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

// === ITEM INDIVIDUAL ===
function ListItem({ item }: { item: ShoppingItem }) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    await toggleItem(item.id, !item.checked)
    setIsToggling(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteItem(item.id)
    setIsDeleting(false)
  }

  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${item.checked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100'}`}>
      <button
        onClick={handleToggle}
        disabled={isToggling || isDeleting}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 disabled:opacity-50 ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400'}`}
      >
        {isToggling
          ? <Loader2 size={12} className="animate-spin" />
          : item.checked && <Check size={14} strokeWidth={4} />
        }
      </button>
      <span className={`flex-1 font-bold text-sm ${item.checked ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
        {item.name}
      </span>
      <button
        onClick={handleDelete}
        disabled={isDeleting || isToggling}
        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}
