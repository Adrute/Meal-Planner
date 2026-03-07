'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Tag, X, Loader2, Palette } from 'lucide-react'
import { updateTagColor } from './actions'

const PASTEL_COLORS = [
  'bg-slate-100 text-slate-600 border-slate-200',
  'bg-purple-50 text-purple-600 border-purple-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-blue-50 text-blue-600 border-blue-200',
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-orange-50 text-orange-600 border-orange-200',
  'bg-cyan-50 text-cyan-600 border-cyan-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-pink-50 text-pink-600 border-pink-200'
]

export default function TagManagerModal({ tags, tagColorsMap }: { tags: string[], tagColorsMap: Record<string, string> }) {
    const [isOpen, setIsOpen] = useState(false)
    const [localColors, setLocalColors] = useState(tagColorsMap)
    const [isPending, startTransition] = useTransition()
    const [loadingTag, setLoadingTag] = useState<string | null>(null)
    
    // Controla qué etiqueta tiene la paleta abierta
    const [editingTag, setEditingTag] = useState<string | null>(null)

    const selectColor = (tag: string, color: string) => {
        if (isPending) return
        
        // Actualizamos visualmente al instante y cerramos la paleta
        setLocalColors(prev => ({ ...prev, [tag]: color }))
        setEditingTag(null) 
        setLoadingTag(tag)
        
        // Guardamos en base de datos
        startTransition(async () => {
            await updateTagColor(tag, color)
            setLoadingTag(null)
        })
    }

    const content = isOpen ? (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            <div className="relative w-full md:w-[450px] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
                
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Tag className="text-purple-500"/> Configurar Etiquetas
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                        Elige un color para cada etiqueta. Se actualizará en los filtros, mapas y fichas de toda la app al instante.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        {tags.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">No hay etiquetas creadas aún.</p>}
                        
                        {tags.map(tag => {
                            const currentColorClass = localColors[tag] || PASTEL_COLORS[0]
                            const isEditing = editingTag === tag
                            
                            return (
                                <div key={tag} className="flex flex-col p-3 bg-slate-50/50 rounded-xl border border-slate-100 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${currentColorClass}`}>
                                            {tag}
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                            {loadingTag === tag && <Loader2 size={16} className="animate-spin text-slate-400" />}
                                            <button 
                                                onClick={() => setEditingTag(isEditing ? null : tag)}
                                                className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-purple-100 text-purple-600' : 'bg-white text-slate-400 hover:text-purple-500 hover:bg-purple-50 shadow-sm border border-slate-100'}`}
                                                title="Editar Color"
                                            >
                                                <Palette size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PALETA DE COLORES DESPLEGABLE */}
                                    {isEditing && (
                                        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm grid grid-cols-5 gap-2 animate-in slide-in-from-top-2 duration-200">
                                            {PASTEL_COLORS.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectColor(tag, color)}
                                                    className={`h-8 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${color} ${currentColorClass === color ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                                                    title="Seleccionar este color"
                                                >
                                                    <span className="text-[10px] font-black opacity-50">Aa</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    ) : null

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center justify-end gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm w-full">
                Etiquetas <div className="bg-purple-100 text-purple-600 p-2 rounded-full"><Tag size={16} /></div>
            </button>
            {typeof window !== 'undefined' && createPortal(content, document.body)}
        </>
    )
}