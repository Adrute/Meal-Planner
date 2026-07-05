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
    <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-orange-100 transition-colors"
      >
        <span className="text-sm font-bold text-orange-700">
          {recipes.length} receta{recipes.length !== 1 ? 's' : ''} sin ingredientes
        </span>
        {open ? <ChevronUp size={16} className="text-orange-400" /> : <ChevronDown size={16} className="text-orange-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-orange-100">
          <div className="flex items-center justify-between mt-4 mb-3">
            <button
              onClick={toggleAll}
              className="text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors"
            >
              {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
            <button
              onClick={handleDelete}
              disabled={!selected.size || isPending}
              className="flex items-center gap-1.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Eliminar ({selected.size})
            </button>
          </div>

          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {recipes.map(r => (
              <li key={r.id}>
                <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:text-slate-900 py-0.5">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="accent-red-500 w-4 h-4 rounded"
                  />
                  {r.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
