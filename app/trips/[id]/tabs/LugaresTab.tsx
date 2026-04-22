'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Plus, Trash2, Loader2, MapPin, Search, CheckCircle2, Circle } from 'lucide-react'
import { addPoi, togglePoiVisited, deletePoi } from '../../actions'
import type { Trip, Poi } from '../TripDetail'

const TripPoisMap = dynamic(() => import('./TripPoisMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full text-slate-400 text-sm">Cargando mapa...</div>
)})

type OsmResult = { place_id: number; display_name: string; lat: string; lon: string; type: string; extratags?: Record<string, string> }

export default function LugaresTab({ trip, pois }: { trip: Trip; pois: Poi[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<OsmResult[]>([])
  const [savingName, setSavingName] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&extratags=1&limit=6`
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
      setResults(await res.json())
    } catch { /* ignore */ } finally { setSearching(false) }
  }

  const handleSelect = async (r: OsmResult) => {
    setSavingName(r.display_name)
    setResults([])
    setQuery('')
    const shortName = r.display_name.split(',')[0].trim()
    await addPoi(trip.id, {
      name: shortName,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      osm_id: String(r.place_id),
      category: r.type || undefined,
      address: r.display_name,
    })
    setSavingName(null)
    startTransition(() => router.refresh())
  }

  const handleToggle = async (id: string, visited: boolean) => {
    setTogglingId(id)
    await togglePoiVisited(id, !visited, trip.id)
    setTogglingId(null)
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deletePoi(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const visited  = pois.filter(p => p.visited).length
  const withCoords = pois.filter(p => p.lat && p.lon)

  return (
    <div className="space-y-4">
      {/* Map */}
      {withCoords.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: 380 }}>
          <TripPoisMap pois={pois} />
        </div>
      )}

      {/* Stats */}
      {pois.length > 0 && (
        <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
          <span>{pois.length} lugares guardados</span>
          <span>·</span>
          <span className="text-emerald-600">{visited} visitados</span>
          <span>·</span>
          <span className="text-violet-500">{pois.length - visited} pendientes</span>
        </div>
      )}

      {/* OSM search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Buscar lugar</p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={`Buscar en ${trip.destination}...`}
            className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400"
          />
          <button onClick={search} disabled={searching}
            className="flex items-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {savingName && (
          <p className="text-xs text-violet-500 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" /> Guardando {savingName.split(',')[0]}...
          </p>
        )}

        {results.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
            {results.map(r => (
              <button key={r.place_id} onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                <p className="font-bold">{r.display_name.split(',')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{r.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POI list */}
      {pois.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Sin lugares guardados</p>
          <p className="text-sm mt-1">Busca lugares con OSM y guárdalos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pois.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 group">
              <button onClick={() => handleToggle(p.id, p.visited)} disabled={togglingId === p.id}
                className="shrink-0 mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors">
                {togglingId === p.id
                  ? <Loader2 size={18} className="animate-spin" />
                  : p.visited
                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                    : <Circle size={18} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-slate-800 ${p.visited ? 'line-through opacity-50' : ''}`}>{p.name}</p>
                {p.category && <p className="text-xs text-violet-500 font-medium capitalize">{p.category}</p>}
                {p.address && <p className="text-xs text-slate-400 truncate mt-0.5">{p.address}</p>}
                {p.notes && <p className="text-xs text-slate-500 italic mt-0.5">{p.notes}</p>}
              </div>
              <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0 self-start">
                {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
