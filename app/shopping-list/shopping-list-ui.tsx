'use client'

import { useState, useEffect } from 'react'
import { addItem, toggleItem, deleteItem, importWeekIngredients, clearList, reorderItems, setSubgroup, moveItemToSubgroup } from './actions'
import {
  Plus, Trash2, Check, ShoppingBag, Loader2, Sparkles, Eraser, Store, ChevronDown, Tags, Tag, GripVertical, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  DndContext, closestCenter, useSensor, useSensors, useDroppable, MouseSensor, TouchSensor,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Ids de zonas droppable que no son productos (pseudo-subgrupo "sin subgrupo" y la zona de creación)
const NO_GROUP_ID = '__container_no_group__'
const NEW_SUBGROUP_ID = '__container_new_subgroup__'
const subgroupContainerId = (name: string) => `__container_sg__${name}`

type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  is_manual: boolean
  store: string
  subgroup: string | null
  position: number | null
}

export default function ShoppingListClient({
  initialItems,
  stores,
}: {
  initialItems: ShoppingItem[]
  stores: string[]
}) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [newItemStore, setNewItemStore] = useState(stores[0] || 'Sin tienda')
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => { setItems(initialItems) }, [initialItems])

  const pending = items.filter(i => !i.checked)
  const completed = items.filter(i => i.checked)

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
    if (!res.success) alert(res.error)
    else if (res.added === 0) alert(`Ya tenías en la lista los ${res.total} ingredientes de tus recetas de esta semana.`)
    else alert(`${res.added} ingredientes nuevos añadidos (${res.total - res.added} ya estaban en la lista).`)
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

  // Reordenar productos dentro de un mismo grupo (tienda + subgrupo), optimista con revert en error
  const handleReorder = async (store: string, groupIds: string[], newOrderIds: string[]) => {
    const previous = items
    const groupIdSet = new Set(groupIds)
    const idToItem = new Map(items.map(i => [i.id, i]))
    let ptr = 0
    const reordered = items.map(item =>
      groupIdSet.has(item.id) ? idToItem.get(newOrderIds[ptr++])! : item
    )
    setItems(reordered)
    setError(null)

    const storeIds = reordered.filter(i => !i.checked && i.store === store).map(i => i.id)
    const res = await reorderItems(store, storeIds)
    if (res?.error) {
      setItems(previous)
      setError(res.error)
    }
  }

  // Asignar/quitar subgrupo de un producto, optimista con revert en error
  const handleSubgroupChange = async (itemId: string, value: string | null) => {
    const previous = items
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, subgroup: value } : i)))
    setError(null)

    const res = await setSubgroup(itemId, value)
    if (res?.error) {
      setItems(previous)
      setError(res.error)
    }
  }

  // Mover un producto a otro subgrupo (drag entre contenedores), siempre al final del destino.
  // Cubre "sin subgrupo" (newSubgroup = null), un subgrupo existente o uno recién creado.
  const handleMoveToSubgroup = async (store: string, itemId: string, newSubgroup: string | null) => {
    const previous = items
    const itemIndex = previous.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return

    const movedItem = { ...previous[itemIndex], subgroup: newSubgroup }
    const withoutItem = previous.filter(i => i.id !== itemId)

    let lastIndex = -1
    withoutItem.forEach((i, idx) => {
      if (i.store === store && (i.subgroup ?? null) === newSubgroup) lastIndex = idx
    })
    const insertAt = lastIndex === -1 ? withoutItem.length : lastIndex + 1
    const reordered = [...withoutItem.slice(0, insertAt), movedItem, ...withoutItem.slice(insertAt)]
    setItems(reordered)
    setError(null)

    const destIds = reordered
      .filter(i => i.store === store && (i.subgroup ?? null) === newSubgroup)
      .map(i => i.id)
    const res = await moveItemToSubgroup(itemId, newSubgroup, store, destIds)
    if (res?.error) {
      setItems(previous)
      setError(res.error)
    }
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

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

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
              onReorder={handleReorder}
              onSubgroupChange={handleSubgroupChange}
              onMoveToSubgroup={handleMoveToSubgroup}
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
function StoreSection({
  store, items, onReorder, onSubgroupChange, onMoveToSubgroup,
}: {
  store: string
  items: ShoppingItem[]
  onReorder: (store: string, groupIds: string[], newOrderIds: string[]) => void
  onSubgroupChange: (itemId: string, value: string | null) => void
  onMoveToSubgroup: (store: string, itemId: string, newSubgroup: string | null) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const [pendingNewSubgroup, setPendingNewSubgroup] = useState<{ itemId: string } | null>(null)

  const storeColors: Record<string, string> = {
    'Sin tienda': 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const colorClass = storeColors[store] ?? 'bg-emerald-50 text-emerald-700 border-emerald-100'

  // Agrupar por subgrupo preservando el orden de aparición (= posición mínima, ya que items llega ordenado por position)
  const noGroup: ShoppingItem[] = []
  const groupsMap = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    if (!item.subgroup) { noGroup.push(item); continue }
    if (!groupsMap.has(item.subgroup)) groupsMap.set(item.subgroup, [])
    groupsMap.get(item.subgroup)!.push(item)
  }
  const subgroupEntries = Array.from(groupsMap.entries())

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  // Resuelve a qué contenedor (sin subgrupo / subgrupo concreto) pertenece un producto
  const findItemContainerKey = (itemId: string): string | undefined => {
    if (noGroup.some(i => i.id === itemId)) return NO_GROUP_ID
    for (const [name, groupItems] of subgroupEntries) {
      if (groupItems.some(i => i.id === itemId)) return subgroupContainerId(name)
    }
    return undefined
  }

  // Resuelve el contenedor "over": puede ser el id de un contenedor vacío/cabecera o el id de un producto dentro de él
  const resolveOverKey = (overId: string): string | undefined => {
    if (overId === NO_GROUP_ID) return NO_GROUP_ID
    if (subgroupEntries.some(([name]) => subgroupContainerId(name) === overId)) return overId
    return findItemContainerKey(overId)
  }

  const getGroupItemsByKey = (key: string): ShoppingItem[] => {
    if (key === NO_GROUP_ID) return noGroup
    return subgroupEntries.find(([name]) => subgroupContainerId(name) === key)?.[1] ?? []
  }

  const sourceKeyDuringDrag = draggingId ? findItemContainerKey(draggingId) : null
  const isHighlighted = (key: string) => overKey === key && sourceKeyDuringDrag !== key

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverKey(event.over ? resolveOverKey(String(event.over.id)) ?? null : null)
  }

  const handleDragCancel = () => {
    setDraggingId(null)
    setOverKey(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    setOverKey(null)
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const sourceKey = findItemContainerKey(activeId)
    if (!sourceKey) return

    if (overId === NEW_SUBGROUP_ID) {
      setPendingNewSubgroup({ itemId: activeId })
      return
    }

    const destKey = resolveOverKey(overId)
    if (!destKey) return

    if (destKey === sourceKey) {
      const groupItems = getGroupItemsByKey(sourceKey)
      const ids = groupItems.map(i => i.id)
      const oldIndex = ids.indexOf(activeId)
      const overIndex = ids.indexOf(overId)
      const newIndex = overIndex === -1 ? ids.length - 1 : overIndex
      if (oldIndex === -1 || oldIndex === newIndex) return
      onReorder(store, ids, arrayMove(ids, oldIndex, newIndex))
      return
    }

    const newSubgroup = destKey === NO_GROUP_ID
      ? null
      : subgroupEntries.find(([name]) => subgroupContainerId(name) === destKey)?.[0] ?? null
    onMoveToSubgroup(store, activeId, newSubgroup)
  }

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

      {/* Items de la sección, agrupados por subgrupo, un único DndContext para permitir mover entre subgrupos */}
      {!collapsed && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="px-3 pb-3 space-y-4">
            <SubgroupBlock
              id={NO_GROUP_ID}
              title={null}
              items={noGroup}
              highlighted={isHighlighted(NO_GROUP_ID)}
              onSubgroupChange={onSubgroupChange}
            />

            {subgroupEntries.map(([name, groupItems]) => (
              <SubgroupBlock
                key={name}
                id={subgroupContainerId(name)}
                title={name}
                items={groupItems}
                highlighted={isHighlighted(subgroupContainerId(name))}
                onSubgroupChange={onSubgroupChange}
              />
            ))}

            <NewSubgroupDropZone
              highlighted={isHighlighted(NEW_SUBGROUP_ID)}
              pending={pendingNewSubgroup !== null}
              onConfirm={(name) => {
                if (!pendingNewSubgroup) return
                onMoveToSubgroup(store, pendingNewSubgroup.itemId, name)
                setPendingNewSubgroup(null)
              }}
              onCancel={() => setPendingNewSubgroup(null)}
            />
          </div>
        </DndContext>
      )}
    </div>
  )
}

// === BLOQUE DE SUBGRUPO (droppable estable + sortable, incluye "sin subgrupo") ===
function SubgroupBlock({
  id, title, items, highlighted, onSubgroupChange,
}: {
  id: string
  title: string | null
  items: ShoppingItem[]
  highlighted: boolean
  onSubgroupChange: (itemId: string, value: string | null) => void
}) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div>
      {title && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1.5">{title}</p>
      )}
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 rounded-xl transition-colors ${highlighted ? 'ring-2 ring-emerald-300 bg-emerald-50/50' : ''}`}
        >
          {items.length === 0 ? (
            <div className="min-h-[44px] rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Suelta aquí
            </div>
          ) : (
            items.map(item => (
              <SortableListItem key={item.id} item={item} onSubgroupChange={onSubgroupChange} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// === ZONA "+ NUEVO SUBGRUPO" (droppable, con input inline al soltar para nombrarlo) ===
function NewSubgroupDropZone({
  highlighted, pending, onConfirm, onCancel,
}: {
  highlighted: boolean
  pending: boolean
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const { setNodeRef } = useDroppable({ id: NEW_SUBGROUP_ID })
  const [value, setValue] = useState('')

  useEffect(() => { if (!pending) setValue('') }, [pending])

  if (pending) {
    return (
      <div ref={setNodeRef} className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-3">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => {
            const trimmed = value.trim()
            if (trimmed) onConfirm(trimmed)
            else onCancel()
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') { setValue(''); onCancel() }
          }}
          placeholder="Nombre del nuevo subgrupo..."
          className="w-full bg-white text-sm font-bold text-slate-700 border border-emerald-300 rounded-lg px-3 py-2 outline-none"
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
        highlighted ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-300'
      }`}
    >
      <Plus size={12} />
      Nuevo subgrupo
    </div>
  )
}

// === ITEM ORDENABLE (envuelve ListItem con drag handle) ===
function SortableListItem({
  item, onSubgroupChange,
}: {
  item: ShoppingItem
  onSubgroupChange: (itemId: string, value: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'relative z-10 opacity-70' : 'relative'}>
      <ListItem item={item} onSubgroupChange={onSubgroupChange} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// === ITEM INDIVIDUAL ===
function ListItem({
  item, dragHandleProps, onSubgroupChange,
}: {
  item: ShoppingItem
  dragHandleProps?: Record<string, unknown>
  onSubgroupChange?: (itemId: string, value: string | null) => void
}) {
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
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${item.checked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100'}`}>
      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps}
          aria-label="Reordenar producto"
          className="shrink-0 -ml-1 p-1 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 cursor-grab active:cursor-grabbing touch-none transition-colors"
        >
          <GripVertical size={16} />
        </button>
      )}
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
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`flex-1 min-w-0 truncate font-bold text-sm ${item.checked ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
          {item.name}
        </span>
        {onSubgroupChange ? (
          <SubgroupTag item={item} onChange={onSubgroupChange} />
        ) : item.subgroup ? (
          <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
            {item.subgroup}
          </span>
        ) : null}
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting || isToggling}
        className="shrink-0 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

// === CHIP DE SUBGRUPO (editable inline, pensado para móvil) ===
function SubgroupTag({
  item, onChange,
}: {
  item: ShoppingItem
  onChange: (itemId: string, value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(item.subgroup ?? '')

  useEffect(() => { setValue(item.subgroup ?? '') }, [item.subgroup])

  const confirm = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (item.subgroup ?? '')) return
    onChange(item.id, trimmed || null)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={confirm}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setValue(item.subgroup ?? ''); setEditing(false) }
        }}
        placeholder="Subgrupo"
        className="shrink-0 w-24 text-[10px] font-bold text-slate-600 border border-emerald-300 rounded-full px-2.5 py-1 outline-none bg-white"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border transition-colors ${
        item.subgroup
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300'
          : 'bg-slate-50 text-slate-300 border-transparent hover:text-slate-400 hover:bg-slate-100'
      }`}
    >
      <Tag size={10} />
      {item.subgroup || 'Subgrupo'}
    </button>
  )
}
