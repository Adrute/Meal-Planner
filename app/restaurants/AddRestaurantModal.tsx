'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Search, MapPin, Tag, Star, CalendarDays, UtensilsCrossed } from 'lucide-react'
import { addRestaurant } from './actions'

const PREDEFINED_TAGS = ['Sin Gluten', 'Vegano', 'Vegetariano', 'Sin Lactosa', 'Picante']
const FOOD_TYPES = ['Asiática', 'Italiana', 'Americana', 'Mediterránea', 'Mexicana', 'India', 'Fusión', 'Otro']

export default function AddRestaurantModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Estados básicos
    const [name, setName] = useState('')
    const [status, setStatus] = useState('pending')
    const [comments, setComments] = useState('')

    // Nuevos estados
    const [isFavorite, setIsFavorite] = useState(false)
    const [foodType, setFoodType] = useState('Otro')
    const [reservationDate, setReservationDate] = useState('')

    // Buscador
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    // Alérgenos
    const [allergenInput, setAllergenInput] = useState('')
    const [allergens, setAllergens] = useState<string[]>([])

    useEffect(() => { setMounted(true) }, [])

    const searchLocation = async () => {
        if (!searchQuery) return
        setIsSearching(true)
        try {
            // Filtrado a España y centrado en las coordenadas geográficas de tu entorno
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=es&viewbox=-4.2,40.6,-3.4,40.1&bounded=0`
            const res = await fetch(url)
            const data = await res.json()
            setSearchResults(data.slice(0, 5))
        } catch (error) { console.error(error) }
        setIsSearching(false)
    }

    const toggleAllergen = (tag: string) => {
        if (allergens.includes(tag)) {
            setAllergens(allergens.filter(t => t !== tag))
        } else {
            setAllergens([...allergens, tag])
        }
    }

    const handleAddCustomAllergen = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && allergenInput.trim() !== '') {
            e.preventDefault()
            if (!allergens.includes(allergenInput.trim())) {
                setAllergens([...allergens, allergenInput.trim()])
            }
            setAllergenInput('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedLocation || !name) return

        await addRestaurant({
            name,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            status,
            comments,
            allergens,
            is_favorite: isFavorite,
            food_type: foodType,
            reservation_date: reservationDate || null
        })

        setIsOpen(false)
        setName(''); setComments(''); setSearchQuery(''); setSearchResults([]);
        setSelectedLocation(null); setAllergens([]); setIsFavorite(false);
        setFoodType('Otro'); setReservationDate('');
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

            <div className="relative w-full md:w-[450px] shrink-0 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 h-full">

                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white shrink-0">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 m-0">
                        <MapPin className="text-rose-500" /> Nuevo Restaurante
                    </h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-500'}`}
                            title="Marcar como favorito"
                        >
                            <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">

                    {/* 1. UBICACIÓN */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">1. Ubicación</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ej: Goiko Grill Madrid"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-slate-700 bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                            />
                            <button type="button" onClick={searchLocation} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl font-bold transition-colors">
                                {isSearching ? '...' : <Search size={18} />}
                            </button>
                        </div>
                        {searchResults.length > 0 && !selectedLocation && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mt-2">
                                {searchResults.map((result: any, i: number) => (
                                    <div
                                        key={i}
                                        className="p-3 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer border-b last:border-0 border-slate-100"
                                        onClick={() => {
                                            setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
                                            if (!name) setName(result.display_name.split(',')[0])
                                            setSearchResults([])
                                        }}
                                    >
                                        {result.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedLocation && (
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-medium flex justify-between items-center mt-2 border border-emerald-100">
                                <span className="flex items-center gap-2"><MapPin size={16} /> Ubicación fijada</span>
                                <button type="button" onClick={() => setSelectedLocation(null)} className="text-emerald-700 hover:text-emerald-900 underline text-xs">Cambiar</button>
                            </div>
                        )}
                    </div>

                    {/* 2. DETALLES BÁSICOS */}
                    <div className="space-y-4 pt-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block border-t border-slate-100 pt-4">2. Detalles</label>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-600">Nombre del Local</span>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-slate-700 bg-white" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-600">Estado</span>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-700 bg-white">
                                    <option value="pending">Pendiente (Azul) ⏳</option>
                                    <option value="approved">Aprobado (Verde) ✅</option>
                                    <option value="rejected">Descartado (Rojo) ❌</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-600">Tipo Comida</span>
                                <div className="relative">
                                    <select value={foodType} onChange={(e) => setFoodType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-slate-700 bg-white appearance-none">
                                        {FOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <UtensilsCrossed size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. RESERVA FUTURA */}
                    <div className="space-y-2 pt-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block border-t border-slate-100 pt-4 flex items-center gap-1">
                            <CalendarDays size={12} /> 3. Reserva (Opcional)
                        </label>
                        <input
                            type="datetime-local"
                            value={reservationDate}
                            onChange={(e) => setReservationDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-slate-700 bg-white"
                        />
                    </div>

                    {/* 4. ALÉRGENOS / ETIQUETAS */}
                    <div className="space-y-3 pt-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block border-t border-slate-100 pt-4 flex items-center gap-1">
                            <Tag size={12} /> 4. Etiquetas y Alérgenos
                        </label>

                        {/* Etiquetas predefinidas clickeables */}
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map(tag => {
                                const isActive = allergens.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleAllergen(tag)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isActive ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {tag}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Input para etiquetas personalizadas */}
                        <input
                            type="text"
                            placeholder="Añadir otra... (Pulsa Enter)"
                            value={allergenInput}
                            onChange={(e) => setAllergenInput(e.target.value)}
                            onKeyDown={handleAddCustomAllergen}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-sm text-slate-700 bg-white"
                        />

                        {/* Etiquetas añadidas personalizadas (que no están en la lista base) */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {allergens.filter(tag => !PREDEFINED_TAGS.includes(tag)).map((tag, i) => (
                                <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                                    {tag}
                                    <button type="button" onClick={() => toggleAllergen(tag)} className="hover:text-rose-500 hover:bg-rose-50 p-0.5 rounded transition-colors"><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 5. COMENTARIOS */}
                    <div className="space-y-2 pt-2 pb-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block border-t border-slate-100 pt-4">5. Notas Personales</label>
                        <textarea
                            rows={3}
                            placeholder="¿Qué recomiendan pedir? ¿Buen precio?"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none text-slate-700 bg-white"
                        />
                    </div>

                </form>

                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedLocation || !name}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        Guardar Restaurante
                    </button>
                </div>

            </div>
        </div>
    )

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full"
            >
                Añadir Local <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full"><Plus size={16} /></div>
            </button>
            {isOpen && mounted && createPortal(modalContent, document.body)}
        </>
    )
}