'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Poi } from '../TripDetail'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const visitedPin = L.divIcon({
  className: 'bg-transparent border-0',
  html: `<div style="width:20px;height:20px;background:#34d399;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14],
})
const pendingPin = L.divIcon({
  className: 'bg-transparent border-0',
  html: `<div style="width:20px;height:20px;background:#818cf8;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14],
})

function FitBounds({ pois }: { pois: Poi[] }) {
  const map = useMap()
  useEffect(() => {
    const valid = pois.filter(p => p.lat && p.lon)
    if (valid.length === 0) return
    if (valid.length === 1) {
      map.setView([valid[0].lat!, valid[0].lon!], 14)
    } else {
      const bounds = L.latLngBounds(valid.map(p => [p.lat!, p.lon!] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [pois, map])
  return null
}

export default function TripPoisMap({ pois }: { pois: Poi[] }) {
  const hasPois = pois.some(p => p.lat && p.lon)
  const center: [number, number] = hasPois
    ? [pois.find(p => p.lat)!.lat!, pois.find(p => p.lon)!.lon!]
    : [40.4168, -3.7038]

  return (
    <MapContainer center={center} zoom={12} className="w-full h-full z-0" zoomControl>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap contributors © CARTO"
      />
      <FitBounds pois={pois} />
      {pois.filter(p => p.lat && p.lon).map(p => (
        <Marker key={p.id} position={[p.lat!, p.lon!]} icon={p.visited ? visitedPin : pendingPin}>
          <Popup closeButton={false}>
            <div className="p-1 min-w-[140px]">
              <p className="font-bold text-slate-800 text-sm">{p.name}</p>
              {p.category && <p className="text-xs text-slate-500">{p.category}</p>}
              {p.address && <p className="text-xs text-slate-400 mt-1">{p.address}</p>}
              {p.notes && <p className="text-xs text-slate-500 italic mt-1">{p.notes}</p>}
              <p className={`text-xs font-bold mt-1 ${p.visited ? 'text-emerald-600' : 'text-violet-500'}`}>
                {p.visited ? '✓ Visitado' : 'Pendiente'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
