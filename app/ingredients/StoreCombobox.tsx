'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

export function StoreCombobox({ 
  options, 
  defaultValue = '', 
  name,
  inputClassName = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white"
}: { 
  options: string[], 
  defaultValue?: string, 
  name: string,
  inputClassName?: string
}) {
  const [query, setQuery] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Cierra el menú si hacemos clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtra las opciones según lo que el usuario escriba
  const filteredOptions = query === '' 
    ? options 
    : options.filter((option) => option.toLowerCase().includes(query.toLowerCase()))

  // Comprueba si lo que ha escrito coincide exactamente con algo que ya existe
  const exactMatch = options.some((option) => option.toLowerCase() === query.toLowerCase())

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input oculto que envía el dato real al servidor al darle a Guardar */}
      <input type="hidden" name={name} value={query} />
      
      <div className="relative">
        <input
          type="text"
          className={`${inputClassName} pr-10`}
          placeholder="Buscar o crear..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-h-60 overflow-auto py-2">
          
          {filteredOptions.length > 0 && (
            <div className="px-3 pb-2 mb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Tiendas guardadas
            </div>
          )}

          {filteredOptions.map((option) => (
            <li
              key={option}
              className="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm text-slate-700 transition-colors"
              onClick={() => {
                setQuery(option)
                setIsOpen(false)
              }}
            >
              {option}
            </li>
          ))}
          
          {/* BOTÓN DE CREAR NUEVO (Aparece si escribes algo que no existe) */}
          {!exactMatch && query.trim() !== '' && (
            <li
              className="px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm font-bold text-emerald-600 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"
              onClick={() => {
                setQuery(query.trim())
                setIsOpen(false)
              }}
            >
              <Plus size={16} /> Crear &quot;{query}&quot;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}