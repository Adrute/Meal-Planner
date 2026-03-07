'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, Star, ExternalLink, CheckCircle2, Clock, UtensilsCrossed, XCircle, Filter, X, ChevronDown, Check, Edit3, Save, Loader2 } from 'lucide-react'
import { updateRestaurant } from '../actions'

const PREDEFINED_TAGS = ['Sin Gluten', 'Vegano', 'Vegetariano', 'Sin Lactosa', 'Picante']
const FOOD_TYPES = ['Asiática', 'Italiana', 'Americana', 'Mediterránea', 'Mexicana', 'India', 'Fusión', 'Otro']

// Opciones con formato "bonito" para los filtros
const STATUS_OPTIONS = [
  { id: 'liked', label: 'Me gusta' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'doubtful', label: 'En duda' },
  { id: 'rejected', label: 'Descartado' }
]

// Filtro actualizado para recibir un array de objetos con id y label
function MultiSelectFilter({ title, options, selectedValues, onChange }: { title: string, options: {id: string, label: string}[], selectedValues: string[], onChange: (values: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (id: string) => {
    if (selectedValues.includes(id)) onChange(selectedValues.filter(v => v !== id))
    else onChange([...selectedValues, id])
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-sm font-medium text-slate-700 w-full justify-between">
        <span className="truncate">{title} {selectedValues.length > 0 && `(${selectedValues.length})`}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-10 space-y-1 max-h-60 overflow-y-auto">
          {options.map(opt => {
            const isSelected = selectedValues.includes(opt.id)
            return (
              <button key={opt.id} onClick={() => handleToggle(opt.id)} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}><Check size={12} strokeWidth={3} /></div>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TableClient({ initialRestaurants, tagColorsMap }: { initialRestaurants: any[], tagColorsMap: Record<string, string> }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [favFilter, setFavFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [allergenInput, setAllergenInput] = useState('')
  const [isPending, startTransition] = useTransition()

  // Convertimos dinámicamente Tipos y Tags en el formato { id, label }
  const uniqueTypes = Array.from(new Set(restaurants.map(r => r.food_type).filter(Boolean))).sort().map(t => ({ id: t as string, label: t as string }))
  const uniqueTags = Array.from(new Set(restaurants.flatMap(r => r.allergens || []))).filter(Boolean).sort().map(t => ({ id: t as string, label: t as string }))

  const filtered = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(search.toLowerCase()) || rest.allergens?.some((a: string) => a.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(rest.status)
    const matchesType = typeFilters.length === 0 || typeFilters.includes(rest.food_type)
    const matchesTag = tagFilters.length === 0 || tagFilters.every((tag: string) => rest.allergens?.includes(tag))
    const matchesFav = !favFilter || rest.is_favorite
    return matchesSearch && matchesStatus && matchesType && matchesTag && matchesFav
  })

  const hasActiveFilters = statusFilters.length > 0 || typeFilters.length > 0 || tagFilters.length > 0 || favFilter

  const toggleFav = (rest: any) => {
    startTransition(async () => {
      const newFav = !rest.is_favorite
      await updateRestaurant(rest.id, { ...rest, is_favorite: newFav, reservations: undefined })
      setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, is_favorite: newFav } : r))
    })
  }

  const startEditing = (rest: any) => {
    setEditingId(rest.id)
    setEditData({ ...rest })
    setAllergenInput('')
  }

  const saveEdit = (rest: any) => {
    startTransition(async () => {
      const payload = {
        name: editData.name, status: editData.status, food_type: editData.food_type,
        allergens: editData.allergens, is_favorite: editData.is_favorite, comments: editData.comments,
        lat: editData.lat, lng: editData.lng, website: editData.website
      }
      await updateRestaurant(rest.id, payload)
      setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, ...payload } : r))
      setEditingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o alérgeno..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors ${hasActiveFilters ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <Filter size={18} /> Filtros {hasActiveFilters && `(${statusFilters.length + typeFilters.length + tagFilters.length + (favFilter ? 1 : 0)})`}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Filter size={20} className="text-blue-500" /> Panel de Filtros Avanzado</h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PASAMOS LOS NUEVOS ARRAYS CON FORMATO { id, label } */}
            <MultiSelectFilter title="Estado del Local" options={STATUS_OPTIONS} selectedValues={statusFilters} onChange={setStatusFilters} />
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

      {/* La tabla se mantiene intacta... */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <th className="p-4 pl-6 w-1/3">Restaurante</th>
                <th className="p-4 w-1/6">Estado</th>
                <th className="p-4 w-1/3">Etiquetas</th>
                <th className="p-4 pr-6 text-right w-1/6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(rest => {
                const isEditing = editingId === rest.id

                if (isEditing) {
                  return (
                    <tr key={rest.id} className="bg-blue-50/30">
                      <td className="p-4 pl-6">
                        <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full mb-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:border-blue-500 outline-none" />
                        <select value={editData.food_type} onChange={e => setEditData({...editData, food_type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 focus:border-blue-500 outline-none">
                          {FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="p-4 align-top">
                        <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none">
                          {STATUS_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {editData.allergens?.map((tag: string) => (
                            <span key={tag} className="bg-slate-800 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                              {tag} <button onClick={() => setEditData({...editData, allergens: editData.allergens.filter((t:string) => t !== tag)})} className="hover:text-rose-400"><X size={10}/></button>
                            </span>
                          ))}
                        </div>
                        <input type="text" placeholder="Añadir etiqueta + Enter" value={allergenInput} onChange={e => setAllergenInput(e.target.value)} onKeyDown={e => {
                          if(e.key === 'Enter' && allergenInput.trim()) {
                            e.preventDefault();
                            if(!editData.allergens?.includes(allergenInput.trim())) setEditData({...editData, allergens: [...(editData.allergens || []), allergenInput.trim()]})
                            setAllergenInput('')
                          }
                        }} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-blue-500 outline-none" />
                      </td>
                      <td className="p-4 pr-6 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => saveEdit(rest)} disabled={isPending} className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50">
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          </button>
                          <button onClick={() => setEditingId(null)} disabled={isPending} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFav(rest)} disabled={isPending} className="focus:outline-none disabled:opacity-50" title={rest.is_favorite ? "Quitar favorito" : "Marcar como favorito"}>
                          <Star size={16} className={`transition-colors hover:scale-110 ${rest.is_favorite ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 hover:text-amber-400'}`} />
                        </button>
                        <span className="font-bold text-slate-800">{rest.name}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 pl-6">
                        <UtensilsCrossed size={12} /> {rest.food_type || 'Otro'}
                      </div>
                    </td>
                    <td className="p-4">
                      {rest.status === 'liked' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 size={14}/> Me gusta</span>}
                      {rest.status === 'pending' && <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><Clock size={14}/> Pendiente</span>}
                      {rest.status === 'doubtful' && <span className="bg-violet-50 text-violet-600 border border-violet-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><Clock size={14}/> En duda</span>}
                      {rest.status === 'rejected' && <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"><XCircle size={14}/> Descartado</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {rest.allergens?.length > 0 ? rest.allergens.map((tag: string, i: number) => (
                          <span key={i} className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${tagColorsMap[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{tag}</span>
                        )) : <span className="text-xs text-slate-400">Ninguna</span>}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEditing(rest)} className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><Edit3 size={16} /></button>
                        <Link href={`/restaurants/${rest.id}`} className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 p-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"><ExternalLink size={16} /></Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 font-bold">No se han encontrado locales con estos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}