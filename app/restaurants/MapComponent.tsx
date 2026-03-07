'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CheckCircle2, Clock, Star, Car, CalendarDays, UtensilsCrossed, ExternalLink, MapPin, Navigation as NavigationIcon, XCircle, X, Globe } from 'lucide-react'

function RestaurantPopupContent({ rest, tagColorsMap }: { rest: any, tagColorsMap: Record<string, string> }) {
  const map = useMap()
  const [showNav, setShowNav] = useState(false)
  
  const activeReservations = rest.reservations?.sort((a:any, b:any) => new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime()) || []
  const nextReservation = activeReservations[0]?.reservation_date
  const hasReservation = !!nextReservation
  const extraReservationsCount = activeReservations.length - 1

  // Aseguramos que el enlace siempre funcione aunque no tenga https://
  const validWebsite = rest.website ? (rest.website.startsWith('http') ? rest.website : `https://${rest.website}`) : null

  return (
    <div className="w-[280px] p-1 flex flex-col bg-white">
      <div className="p-3 pb-2 flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-800 text-[17px] m-0 leading-tight pr-4">{rest.name}</h3>
            {rest.is_favorite && <Star size={20} className="text-amber-400 fill-amber-400 shrink-0 drop-shadow-sm" />}
        </div>
        <button onClick={() => map.closePopup()} className="p-1.5 -mr-1.5 -mt-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <div className="px-3 pb-3 space-y-3 border-b border-slate-50">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {rest.status === 'liked' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Me gusta</span>}
          {rest.status === 'pending' && <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Clock size={12} /> Pendiente</span>}
          {rest.status === 'doubtful' && <span className="bg-violet-50 text-violet-600 border border-violet-200 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Clock size={12} /> En duda</span>}
          {rest.status === 'rejected' && <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><XCircle size={12} /> Descartado</span>}
          
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <UtensilsCrossed size={12}/> {rest.food_type || 'Otro'}
          </span>

          {rest.allergens?.map((tag: string) => (
            <span key={tag} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${tagColorsMap[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {tag}
            </span>
          ))}
        </div>

        {hasReservation && (
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-purple-500 font-bold text-[11px] uppercase tracking-widest">
                <CalendarDays size={14}/> Próxima Reserva
              </div>
              {extraReservationsCount > 0 && (
                <span className="text-[9px] font-black text-white bg-purple-400 px-1.5 py-0.5 rounded-md shadow-sm">
                  +{extraReservationsCount} más
                </span>
              )}
            </div>
            <div className="text-purple-900 font-bold text-sm">
              {new Date(nextReservation).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2 bg-slate-50/50 rounded-b-2xl flex flex-col gap-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowNav(!showNav)} className="w-full p-2.5 flex items-center justify-center gap-2 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
            <Car size={16} className="text-blue-500" /> {showNav ? 'Ocultar Navegación' : 'Opciones de Navegación'}
          </button>
          
          {showNav && (
            <div className="grid grid-cols-3 gap-1 p-2 pt-0 bg-slate-50 border-t border-slate-100">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=$${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100"><MapPin size={14} /> Google</a>
              <a href={`https://maps.apple.com/?daddr=${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100"><NavigationIcon size={14} /> Apple</a>
              <a href={`https://waze.com/ul?ll=${rest.lat},${rest.lng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100"><Car size={14} /> Waze</a>
            </div>
          )}
        </div>
        
        {/* BOTÓN DE LA WEB EN EL POPUP */}
        {validWebsite && (
          <a href={validWebsite} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-700 border border-slate-200 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm">
            <Globe size={14} /> Visitar Web
          </a>
        )}

        <a href={`/restaurants/${rest.id}`} className="bg-emerald-50 text-emerald-700 border border-emerald-200 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-sm">
          <ExternalLink size={14} /> Abrir Ficha del Local
        </a>
      </div>
    </div>
  )
}

export default function MapComponent({ restaurants, tagColorsMap }: { restaurants: any[], tagColorsMap: Record<string, string> }) {
  const center: [number, number] = [40.4168, -3.7038]

  const { iconFav, iconLiked, iconPending, iconRejected, iconDoubtful } = useMemo(() => {
    const createPin = (color: string) => L.divIcon({
      className: 'bg-transparent border-0',
      html: `<div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -15]
    })
    
    return {
      iconFav: createPin('#fbbf24'),
      iconLiked: createPin('#34d399'),
      iconPending: createPin('#60a5fa'),
      iconDoubtful: createPin('#a78bfa'),
      iconRejected: createPin('#fb7185')
    }
  }, [])

  const getPinIcon = (isFavorite: boolean, status: string) => {
    if (isFavorite) return iconFav
    if (status === 'liked') return iconLiked
    if (status === 'doubtful') return iconDoubtful
    if (status === 'rejected') return iconRejected
    return iconPending
  }

  return (
    <MapContainer center={center} zoom={12} className="w-full h-full z-0" zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='© OSM' />
      {restaurants?.map((rest) => (
        <Marker key={rest.id} position={[rest.lat, rest.lng]} icon={getPinIcon(rest.is_favorite, rest.status)}>
          <Popup closeButton={false} className="custom-popup rounded-3xl overflow-hidden shadow-2xl border-0 p-0 m-0">
            <RestaurantPopupContent rest={rest} tagColorsMap={tagColorsMap} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}