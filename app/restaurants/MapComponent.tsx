'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CheckCircle2, Clock, Star, Car, CalendarDays, UtensilsCrossed, ExternalLink, MapPin, Navigation as NavigationIcon, XCircle, X } from 'lucide-react'

const ALLERGEN_COLORS: Record<string, string> = {
    'Sin Gluten': 'bg-orange-50 text-orange-600 border-orange-100',
    'Vegano': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Vegetariano': 'bg-lime-50 text-lime-600 border-lime-100',
    'Sin Lactosa': 'bg-blue-50 text-blue-600 border-blue-100',
    'Picante': 'bg-red-50 text-red-600 border-red-100',
}

function RestaurantPopupContent({ rest }: { rest: any }) {
    const map = useMap() // Hook de Leaflet para poder cerrar el popup manualmente
    const [showNav, setShowNav] = useState(false)

    const activeReservations = rest.reservations?.sort((a: any, b: any) => new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime()) || []
    const nextReservation = activeReservations[0]?.reservation_date
    const hasReservation = !!nextReservation
    const extraReservationsCount = activeReservations.length - 1

    return (
        <div className="w-[280px] p-1 flex flex-col bg-white">
            {/* Cabecera Limpia */}
            <div className="p-3 pb-2 flex items-start justify-between gap-3 relative">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-[17px] m-0 leading-tight">{rest.name}</h3>
                    {rest.is_favorite && <Star size={20} className="text-amber-400 fill-amber-400 shrink-0 drop-shadow-sm" />}
                </div>
                {/* NUESTRA 'X' PERSONALIZADA QUE CIERRA EL MAPA */}
                <button
                    onClick={() => map.closePopup()}
                    className="p-1.5 -mr-1.5 -mt-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="px-3 pb-3 space-y-3 border-b border-slate-50">
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {(rest.status === 'approved' || rest.status === 'visited') && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Aprobado</span>}
                    {rest.status === 'pending' && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Clock size={12} /> Pendiente</span>}
                    {rest.status === 'rejected' && <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><XCircle size={12} /> Descartado</span>}

                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <UtensilsCrossed size={12} /> {rest.food_type || 'Otro'}
                    </span>

                    {rest.allergens?.map((allergen: string, i: number) => (
                        <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${ALLERGEN_COLORS[allergen] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {allergen}
                        </span>
                    ))}
                </div>

                {hasReservation && (
                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-purple-500 font-bold text-[11px] uppercase tracking-widest">
                                <CalendarDays size={14} /> Próxima Reserva
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

            <div className="p-3 space-y-2 bg-slate-50/50 rounded-b-2xl">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setShowNav(!showNav)} className="w-full p-2.5 flex items-center justify-center gap-2 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
                        <Car size={16} className="text-blue-500" /> {showNav ? 'Ocultar Navegación' : 'Opciones de Navegación'}
                    </button>

                    {showNav && (
                        <div className="grid grid-cols-3 gap-1 p-2 pt-0 bg-slate-50 border-t border-slate-100">
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=$${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100">
                                <MapPin size={14} /> Google
                            </a>
                            <a href={`https://maps.apple.com/?daddr=${rest.lat},${rest.lng}`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100">
                                <NavigationIcon size={14} /> Apple
                            </a>
                            <a href={`https://waze.com/ul?ll=${rest.lat},${rest.lng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-600 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] hover:text-blue-600 shadow-sm border border-slate-100">
                                <Car size={14} /> Waze
                            </a>
                        </div>
                    )}
                </div>
                <a href={`/restaurants/${rest.id}`} className="bg-emerald-50 text-emerald-700 border border-emerald-200 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-sm">
                    <ExternalLink size={14} /> Abrir Ficha del Local
                </a>
            </div>
        </div>
    )
}

export default function MapComponent({ restaurants }: { restaurants: any[] }) {
    const center: [number, number] = [40.4168, -3.7038]

    // DEFINICIÓN DE ICONOS SÓLIDOS (Sin clases residuales de Leaflet)
    const { iconFav, iconApproved, iconPending, iconRejected } = useMemo(() => {
        return {
            iconFav: L.divIcon({ className: '', html: `<div class="w-5 h-5 rounded-full bg-amber-400 ring-2 ring-white shadow-md"></div>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -15] }),
            iconApproved: L.divIcon({ className: '', html: `<div class="w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white shadow-md"></div>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -15] }),
            iconPending: L.divIcon({ className: '', html: `<div class="w-5 h-5 rounded-full bg-blue-500 ring-2 ring-white shadow-md"></div>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -15] }),
            iconRejected: L.divIcon({ className: '', html: `<div class="w-5 h-5 rounded-full bg-rose-500 ring-2 ring-white shadow-md"></div>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -15] })
        }
    }, [])

    const getPinIcon = (isFavorite: boolean, status: string) => {
        if (isFavorite) return iconFav
        if (status === 'approved' || status === 'visited') return iconApproved
        if (status === 'rejected') return iconRejected
        return iconPending
    }

    return (
        <MapContainer center={center} zoom={12} className="w-full h-full z-0" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='© OSM' />
            {restaurants?.map((rest) => (
                <Marker key={rest.id} position={[rest.lat, rest.lng]} icon={getPinIcon(rest.is_favorite, rest.status)}>
                    {/* ANULAMOS LA X DE LEAFLET CON closeButton={false} */}
                    <Popup closeButton={false} className="custom-popup rounded-3xl overflow-hidden shadow-2xl border-0 p-0 m-0">
                        <RestaurantPopupContent rest={rest} />
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}