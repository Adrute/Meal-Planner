'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Tag, Star, UtensilsCrossed, Save, X, Loader2 } from 'lucide-react'
import { updateRestaurant } from '../../actions'

const PREDEFINED_TAGS = ['Sin Gluten', 'Vegano', 'Vegetariano', 'Sin Lactosa', 'Picante']
const FOOD_TYPES = ['Asiática', 'Italiana', 'Americana', 'Mediterránea', 'Mexicana', 'India', 'Fusión', 'Otro']

export default function EditRestaurantForm({ restaurant }: { restaurant: any }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState(restaurant.name)
  const [status, setStatus] = useState(restaurant.status)
  const [comments, setComments] = useState(restaurant.comments || '')
  const [isFavorite, setIsFavorite] = useState(restaurant.is_favorite)
  const [foodType, setFoodType] = useState(restaurant.food_type || 'Otro')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>({
    lat: restaurant.lat, lng: restaurant.lng
  })
  const [isSearching, setIsSearching] = useState(false)

  const [allergenInput, setAllergenInput] = useState('')
  const [allergens, setAllergens] = useState<string[]>(restaurant.allergens || [])

  const searchLocation = async () => {
    if (!searchQuery) return
    setIsSearching(true)
    try {
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
    setIsSaving(true)

    await updateRestaurant(restaurant.id, {
      name,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      status,
      comments,
      allergens,
      is_favorite: isFavorite,
      food_type: foodType
    })

    router.push(`/restaurants/${restaurant.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-8">

      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 m-0">
          <UtensilsCrossed className="text-emerald-500" /> Editando: {restaurant.name}
        </h2>
        <button type="button" onClick={() => setIsFavorite(!isFavorite)} className={`p-3 rounded-full transition-colors ${isFavorite ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-500'}`}>
          <Star size={24} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Nombre del Local</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-700 bg-white font-bold text-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Estado</label>
              <select value={status} disabled={isSaving} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-700 bg-white disabled:opacity-50">
                <option value="pending">Pendiente</option>
                <option value="liked">Me gusta</option>
                <option value="doubtful">En duda</option>
                <option value="rejected">Descartado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Tipo Comida</label>
              <select value={foodType} onChange={(e) => setFoodType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-700 bg-white">
                {FOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Notas Personales</label>
            <textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none text-slate-700 bg-white leading-relaxed" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Cambiar Ubicación</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Buscar nueva dirección..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-700 bg-white text-sm" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())} />
              <button type="button" onClick={searchLocation} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 rounded-xl font-bold transition-colors">{isSearching ? '...' : <Search size={18} />}</button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-2">
                {searchResults.map((result: any, i: number) => (
                  <div key={i} className="p-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer border-b last:border-0 border-slate-100" onClick={() => { setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) }); setSearchResults([]); setSearchQuery(''); }}>
                    {result.display_name}
                  </div>
                ))}
              </div>
            )}
            {selectedLocation && (
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl text-sm font-bold flex items-center justify-between mt-2">
                <span className="flex items-center gap-2"><MapPin size={16} /> {selectedLocation.lat === restaurant.lat ? 'Ubicación actual mantenida' : 'Nueva ubicación fijada'}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1"><Tag size={14} /> Etiquetas y Alérgenos</label>

            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(tag => {
                const isActive = allergens.includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => toggleAllergen(tag)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isActive ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {tag}
                  </button>
                )
              })}
            </div>

            <input type="text" placeholder="Añadir otra... (Pulsa Enter)" value={allergenInput} onChange={(e) => setAllergenInput(e.target.value)} onKeyDown={handleAddCustomAllergen} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-sm text-slate-700 bg-white" />

            <div className="flex flex-wrap gap-2 mt-2">
              {allergens.filter(tag => !PREDEFINED_TAGS.includes(tag)).map((tag, i) => (
                <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  {tag} <button type="button" onClick={() => toggleAllergen(tag)} className="hover:text-rose-500 hover:bg-rose-50 p-0.5 rounded transition-colors"><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSaving || !selectedLocation || !name} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[200px] justify-center">
          {isSaving ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : <><Save size={18} /> Guardar Cambios</>}
        </button>
      </div>

    </form>
  )
}