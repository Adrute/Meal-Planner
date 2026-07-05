'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { deleteEmptyRecipes } from './actions'

type Props = {
  recipes: { id: string; name: string }[]
}

export default function EmptyRecipesPanel({ recipes }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(recipes.map(r => r.id)))
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!recipes.length) return null

  const allSelected = selected.size === recipes.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(recipes.map(r => r.id)))
  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleDelete = () => {
    if (!selected.size) return
    startTransition(async () => {
      await deleteEmptyRecipes([...selected])
      router.refresh()
    })
  }

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-100 transition-colors rounded-2xl"
      >
        <span className="text-sm font-bold text-slate-600">
          {recipes.length} receta{recipes.length !== 1 ? 's' : ''} sin ingredientes
        </span>
        {open
          ? <ChevronUp size={16} className="shrink-0 text-slate-400" />
          : <ChevronDown size={16} className="shrink-0 text-slate-400" />
        }
      </button>

      {open && (
        <div className="border-t border-slate-200">
          <div className="flex items-center gap-3 px-5 py-3">
            <button
              onClick={toggleAll}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            >
              {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDelete}
              disabled={!selected.size || isPending}
              className="flex items-center gap-1.5 shrink-0 text-xs font-bold bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {isPending
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />
              }
              Eliminar ({selected.size})
            </button>
          </div>

          <ul className="space-y-1 max-h-64 overflow-y-auto px-5 pb-4">
            {recipes.map(r => (
              <li key={r.id}>
                <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-slate-900 py-0.5">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="accent-emerald-600 w-4 h-4 shrink-0"
                  />
                  <span className="flex-1 min-w-0 truncate">{r.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
