'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Star, ChevronDown, Check } from 'lucide-react'

// El mapa dinámico sigue igual (con su spinner)
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 z-0">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <span className="font-bold text-sm">Cargando mapa...</span>
    </div>
  )
})

// Estados disponibles unificados
const STATUSES = [
  { id: 'liked', label: 'Me gusta' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'doubtful', label: 'En duda' },
  { id: 'rejected', label: 'Descartado' }
]

// Componente Combo Desplegable
function DropdownFilter({ title, defaultText, options, selectedValues, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (id: string) => {
    if (selectedValues.includes(id)) onChange(selectedValues.filter((v: string) => v !== id))
    else onChange([...selectedValues, id])
  }

  const displayTitle = selectedValues.length === 0 ? defaultText : `${title} (${selectedValues.length})`

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors h-11"
      >
        <span className="truncate">{displayTitle}</span> 
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Capa invisible para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-[1999]" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-full left-0 mt-1.5 w-56 p-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-[2000] space-y-1 max-h-60 overflow-y-auto">
            {options.map((opt: any) => {
              const isSelected = selectedValues.includes(opt.id)
              return (
                <button 
                  key={opt.id} 
                  onClick={() => handleToggle(opt.id)} 
                  className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function MapWrapper({ restaurants, tagColorsMap }: { restaurants: any[], tagColorsMap: Record<string, string> }) {
  const [favFilter, setFavFilter] = useState(false)
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])

  // Extraemos dinámicamente los tipos de comida de los locales que tienes
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(restaurants.map(r => r.food_type).filter(Boolean)))
      .sort()
      .map(type => ({ id: type, label: type as string }))
  }, [restaurants])

  // Filtrado múltiple combinado
  const filtered = restaurants.filter(rest => {
    const matchesFav = !favFilter || rest.is_favorite
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(rest.status)
    const matchesType = typeFilters.length === 0 || typeFilters.includes(rest.food_type)
    return matchesFav && matchesStatus && matchesType
  })

  return (
    <>
      {/* Botones Flotantes del Mapa */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-[1000] flex flex-wrap gap-2 pointer-events-auto items-center">
        
        <button 
          onClick={() => setFavFilter(!favFilter)} 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm text-sm font-bold transition-colors border h-11 ${favFilter ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}
        >
          <Star size={18} className={favFilter ? "fill-amber-500 text-amber-500" : "text-slate-400"} /> Favoritos
        </button>
        
        <DropdownFilter 
          title="Estados" 
          defaultText="Todos los estados" 
          options={STATUSES} 
          selectedValues={statusFilters} 
          onChange={setStatusFilters} 
        />

        {uniqueTypes.length > 0 && (
          <DropdownFilter 
            title="Tipos" 
            defaultText="Tipos de comida" 
            options={uniqueTypes} 
            selectedValues={typeFilters} 
            onChange={setTypeFilters} 
          />
        )}
      </div>
      
      {/* Renderizado del Mapa */}
      <MapComponent restaurants={filtered} tagColorsMap={tagColorsMap} />
    </>
  )
}