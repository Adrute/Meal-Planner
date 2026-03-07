'use client'

import { useState } from 'react'
import { updateTagColor } from '@/app/restaurants/actions'

const PASTEL_COLORS = [
  'bg-slate-50 text-slate-600 border-slate-200',   // Gris (Por defecto)
  'bg-purple-50 text-purple-600 border-purple-200', // Morado
  'bg-emerald-50 text-emerald-600 border-emerald-200', // Verde
  'bg-blue-50 text-blue-600 border-blue-200',      // Azul
  'bg-rose-50 text-rose-600 border-rose-200',      // Rojo
  'bg-amber-50 text-amber-600 border-amber-200',    // Amarillo
  'bg-orange-50 text-orange-600 border-orange-200', // Naranja
  'bg-cyan-50 text-cyan-600 border-cyan-200',      // Cian
]

export default function EditableTag({ tag, initialColor }: { tag: string, initialColor?: string }) {
  const [color, setColor] = useState(initialColor || PASTEL_COLORS[0])
  
  const handleCycle = async () => {
    const currentIndex = PASTEL_COLORS.indexOf(color)
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % PASTEL_COLORS.length
    const nextColor = PASTEL_COLORS[nextIndex]
    
    setColor(nextColor) // Cambio instantáneo visual
    await updateTagColor(tag, nextColor) // Se guarda en base de datos
  }

  return (
    <span 
      onClick={handleCycle} 
      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer select-none transition-colors hover:shadow-sm ${color}`}
      title="Haz clic para cambiar el color"
    >
      {tag}
    </span>
  )
}