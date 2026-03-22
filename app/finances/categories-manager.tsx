'use client'

import { useState } from 'react'
import { createCategory, deleteCategory, createSubcategory, deleteSubcategory } from './actions'
import { COLOR_OPTIONS, type Category } from './constants'
import { ChevronDown, ChevronRight, Layers, Plus, Trash2, Loader2, X } from 'lucide-react'

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-purple-500" />
          <span className="text-sm font-black text-slate-700">Categorías y subcategorías</span>
          <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded-full">
            {categories.length}
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-3">

          {/* Lista de categorías */}
          <div className="space-y-1">
            {categories.map(cat => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                isExpanded={expandedCat === cat.id}
                onToggle={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              />
            ))}
          </div>

          {/* Nueva categoría */}
          <NewCategoryForm />
        </div>
      )}
    </div>
  )
}

// ─── FILA DE CATEGORÍA ────────────────────────────────────────────────────────

function CategoryRow({ cat, isExpanded, onToggle }: { cat: Category; isExpanded: boolean; onToggle: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [isAddingSub, setIsAddingSub] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)

  const handleDeleteCat = async () => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Los movimientos con esta categoría quedarán sin categorizar.`)) return
    setIsDeleting(true)
    const res = await deleteCategory(cat.id)
    if (res?.error) {
      alert(res.error)
      setIsDeleting(false)
    }
  }

  const handleAddSub = async () => {
    if (!newSubName.trim()) return
    setIsAddingSub(true)
    await createSubcategory(cat.id, newSubName)
    setNewSubName('')
    setIsAddingSub(false)
    setShowSubForm(false)
  }

  return (
    <div className={`rounded-xl border transition-all ${isExpanded ? 'border-slate-200 bg-slate-50' : 'border-transparent'} ${isDeleting ? 'opacity-40' : ''}`}>
      {/* Cabecera de categoría */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
          <span className="text-sm font-bold text-slate-700">{cat.name}</span>
          {cat.transaction_subcategories.length > 0 && (
            <span className="text-[10px] text-slate-400">({cat.transaction_subcategories.length})</span>
          )}
          <ChevronRight size={12} className={`text-slate-400 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
        <button
          onClick={handleDeleteCat}
          disabled={isDeleting}
          className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
          title="Eliminar categoría"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      {/* Subcategorías expandibles */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-1">
          {cat.transaction_subcategories.map(sub => (
            <SubcategoryRow key={sub.id} sub={sub} />
          ))}

          {showSubForm ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSub()}
                placeholder="Nueva subcategoría..."
                autoFocus
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-400"
              />
              <button onClick={handleAddSub} disabled={isAddingSub} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50">
                {isAddingSub ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              </button>
              <button onClick={() => { setShowSubForm(false); setNewSubName('') }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSubForm(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-600 transition-colors mt-1 font-bold"
            >
              <Plus size={12} /> Añadir subcategoría
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── FILA DE SUBCATEGORÍA ─────────────────────────────────────────────────────

function SubcategoryRow({ sub }: { sub: { id: string; name: string } }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteSubcategory(sub.id)
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white transition-colors ${isDeleting ? 'opacity-40' : ''}`}>
      <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
      <span className="text-xs text-slate-600 flex-1">{sub.name}</span>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-0.5 text-slate-200 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
      </button>
    </div>
  )
}

// ─── NUEVA CATEGORÍA ──────────────────────────────────────────────────────────

function NewCategoryForm() {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    setError(null)
    const res = await createCategory(name, color)
    if (res?.error) {
      setError(res.error)
      setIsSaving(false)
    } else {
      setName('')
      setColor(COLOR_OPTIONS[0])
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nueva categoría</p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Nombre de la categoría"
          className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400"
        />
        <button
          onClick={handleCreate}
          disabled={isSaving || !name.trim()}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Crear
        </button>
      </div>

      {/* Selector de color */}
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
            style={{ background: c }}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
