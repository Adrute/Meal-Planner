'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Store, Check } from 'lucide-react'
import type { CatalogIngredient } from '@/types/schema'

type Props = {
  ingredients: CatalogIngredient[]
  value: string
  onChange: (name: string, ingredientId?: string, store?: string) => void
  error?: boolean
}

export function IngredientCombobox({ ingredients, value, onChange, error }: Props) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sync when value changes externally (e.g. form reset)
  useEffect(() => {
    setQuery(value)
    if (!value) setSelectedId(undefined)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim() === ''
    ? ingredients
    : ingredients.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))

  const exactMatch = ingredients.find(i => i.name.toLowerCase() === query.toLowerCase())
  const selectedIngredient = ingredients.find(i => i.id === selectedId)

  const handleSelect = (ingredient: CatalogIngredient) => {
    setQuery(ingredient.name)
    setSelectedId(ingredient.id)
    setIsOpen(false)
    onChange(ingredient.name, ingredient.id, ingredient.preferred_store ?? undefined)
  }

  const handleCreateNew = () => {
    const name = query.trim()
    setSelectedId(undefined)
    setIsOpen(false)
    onChange(name, undefined, undefined)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedId(undefined)
    setIsOpen(true)
    onChange(e.target.value, undefined, undefined)
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar ingrediente..."
          className={`w-full pl-9 pr-3 py-3 rounded-xl border text-sm font-medium outline-none transition-all
            ${error ? 'border-red-300 focus:border-red-400' : selectedId ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-400' : 'border-slate-200 focus:border-emerald-400'}
          `}
        />
        {/* Badge de tienda cuando hay selección del catálogo */}
        {selectedIngredient?.preferred_store && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
            <Store size={10} />
            {selectedIngredient.preferred_store}
          </span>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-auto py-1.5">

          {filtered.length > 0 && (
            <li className="px-3 pb-1.5 pt-0.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
              Catálogo ({filtered.length})
            </li>
          )}

          {filtered.map(ingredient => (
            <li
              key={ingredient.id}
              onClick={() => handleSelect(ingredient)}
              className="flex items-center justify-between px-3 py-2 hover:bg-emerald-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                {selectedId === ingredient.id && (
                  <Check size={13} className="text-emerald-600 shrink-0" />
                )}
                <span className={`text-sm font-medium ${selectedId === ingredient.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {ingredient.name}
                </span>
              </div>
              {ingredient.preferred_store && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                  {ingredient.preferred_store}
                </span>
              )}
            </li>
          ))}

          {/* Opción de crear nuevo */}
          {!exactMatch && query.trim().length >= 2 && (
            <li
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-50 cursor-pointer transition-colors border-t border-slate-100 mt-1 text-emerald-700 font-bold text-sm"
            >
              <Plus size={15} className="shrink-0" />
              Crear &quot;{query.trim()}&quot; como nuevo ingrediente
            </li>
          )}

          {filtered.length === 0 && query.trim().length < 2 && (
            <li className="px-3 py-4 text-center text-sm text-slate-400">
              Escribe para buscar...
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
