'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Star, ExternalLink, CheckCircle2, Clock, UtensilsCrossed, XCircle, Filter, X, ChevronDown, Check } from 'lucide-react'

function MultiSelectFilter({ title, options, selectedValues, onChange }: { title: string, options: string[], selectedValues: string[], onChange: (values: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option))
    } else {
      onChange([...selectedValues, option])
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-sm font-medium text-slate-700 w-full justify-between">
        <span className="truncate">{title} {selectedValues.length > 0 && `(${selectedValues.length})`}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-10 space-y-1 max-h-60 overflow-y-auto">
          {options.map(option => {
            const isSelected = selectedValues.includes(option)
            return (
              <button key={option} onClick={() => handleToggle(option)} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left text-sm transition-colors ${isSelected ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}><Check size={12} strokeWidth={3} /></div>
                {option}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TableClient({ restaurants }: { restaurants: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [favFilter, setFavFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const uniqueStatuses = ['pending', 'approved', 'rejected']
  const uniqueTypes = Array.from(new Set(restaurants.map(r => r.food_type).filter(Boolean))).sort()
  const uniqueTags = Array.from(new Set(restaurants.flatMap(r => r.allergens || []))).filter(Boolean).sort()

  const filtered = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(search.toLowerCase()) || rest.allergens?.some((a: string) => a.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(rest.status)
    const matchesType = typeFilters.length === 0 || typeFilters.includes(rest.food_type)
    
    // FILTRO ESTRICTO "AND": Si seleccionas etiquetas, el restaurante DEBE tener todas y cada una de ellas
    const matchesTag = tagFilters.length === 0 || tagFilters.every((tag: string) => rest.allergens?.includes(tag))
    
    const matchesFav = !favFilter || rest.is_favorite
    
    return matchesSearch && matchesStatus && matchesType && matchesTag && matchesFav
  })

  const hasActiveFilters = statusFilters.length > 0 || typeFilters.length > 0 || tagFilters.length > 0 || favFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o alérgeno..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors ${hasActiveFilters ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <Filter size={18} /> Filtros {hasActiveFilters && `(${statusFilters.length + typeFilters.length + tagFilters.length + (favFilter ? 1 : 0)})`}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Filter size={20} className="text-emerald-500" /> Panel de Filtros Avanzado</h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MultiSelectFilter title="Estado del Local" options={uniqueStatuses} selectedValues={statusFilters} onChange={setStatusFilters} />
            <MultiSelectFilter title="Tipo de Comida" options={uniqueTypes} selectedValues={typeFilters} onChange={setTypeFilters} />
            <MultiSelectFilter title="Etiquetas / Alérgenos" options={uniqueTags} selectedValues={tagFilters} onChange={setTagFilters} />
            <button onClick={() => setFavFilter(!favFilter)} className={`p-3 rounded-2xl transition-colors text-sm font-bold flex items-center gap-2 justify-center border ${favFilter ? 'bg-amber-100 text-amber-500 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              <Star size={20} fill={favFilter ? "currentColor" : "none"} /> {favFilter ? 'Ver todos los locales' : 'Filtrar por Favoritos'}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            {(statusFilters.length > 0 || typeFilters.length > 0 || tagFilters.length > 0 || favFilter) && (
              <button onClick={() => { setStatusFilters([]); setTypeFilters([]); setTagFilters([]); setFavFilter(false); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-500">Limpiar todo</button>
            )}
            <button onClick={() => setShowFilters(false)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm">Aplicar y Cerrar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <th className="p-4 pl-6">Restaurante</th><th className="p-4">Estado</th><th className="p-4">Etiquetas</th><th className="p-4 pr-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(rest => (
                <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-800">{rest.name}</span>{rest.is_favorite && <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1"><UtensilsCrossed size={12} /> {rest.food_type || 'Otro'}</div>
                  </td>
                  <td className="p-4">
                    {rest.status === 'approved' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 size={14}/> Aprobado</span>}
                    {rest.status === 'pending' && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><Clock size={14}/> Pendiente</span>}
                    {rest.status === 'rejected' && <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><XCircle size={14}/> Descartado</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {rest.allergens?.map((tag: string, i: number) => (
                        <span key={i} className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-1 rounded-md text-[10px] font-bold">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Link href={`/restaurants/${rest.id}`} className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"><ExternalLink size={16} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}