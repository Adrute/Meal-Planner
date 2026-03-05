'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Filter, Star, Clock, CheckCircle2 } from 'lucide-react'

// Importación dinámica del mapa
const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Cargando mapa interactivo...</div>
})

export default function MapWrapper({ restaurants }: { restaurants: any[] }) {
    // Estados de los filtros
    const [filterFav, setFilterFav] = useState(false)
    const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'visited'
    const [filterType, setFilterType] = useState('all')

    // Extraer tipos de comida únicos para el selector
    const uniqueTypes = Array.from(new Set(restaurants.map(r => r.food_type).filter(Boolean)))

    // Aplicar filtros en tiempo real
    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(rest => {
            if (filterFav && !rest.is_favorite) return false
            if (filterStatus !== 'all' && rest.status !== filterStatus) return false
            if (filterType !== 'all' && rest.food_type !== filterType) return false
            return true
        })
    }, [restaurants, filterFav, filterStatus, filterType])

    return (
        <>
            {/* BARRA DE FILTROS FLOTANTE */}
            <div className="absolute top-4 left-4 right-4 md:right-auto z-[1000] flex flex-wrap gap-2 pointer-events-auto">

                {/* Filtro Favoritos */}
                <button
                    onClick={() => setFilterFav(!filterFav)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${filterFav ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                >
                    <Star size={16} fill={filterFav ? "currentColor" : "none"} /> Favoritos
                </button>

                {/* Filtro Estado */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-xl text-sm font-bold shadow-md border border-slate-100 outline-none cursor-pointer bg-white text-slate-600"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">⏳ Pendientes</option>
                    <option value="visited">✅ Visitados</option>
                </select>

                {/* Filtro Tipo de Comida */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 rounded-xl text-sm font-bold shadow-md border border-slate-100 outline-none cursor-pointer bg-white text-slate-600 max-w-[150px] truncate"
                >
                    <option value="all">Tipos de comida</option>
                    {uniqueTypes.map(type => (
                        <option key={type as string} value={type as string}>{type as string}</option>
                    ))}
                </select>

            </div>

            {/* MAPA */}
            <MapWithNoSSR restaurants={filteredRestaurants} />
        </>
    )
}