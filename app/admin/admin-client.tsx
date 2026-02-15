'use client'

import { useState } from 'react'
import { deletePastPlans, deleteRecipe } from './actions'
import { Trash2, Loader2, Eraser } from 'lucide-react'

// Botón para borrar planes antiguos
export function DeletePlansButton({ disabled }: { disabled: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleClean = async () => {
    if (!confirm('ATENCIÓN: Esto borrará permanentemente todo el historial de comidas anteriores a hoy. ¿Estás seguro?')) return
    
    setLoading(true)
    const res = await deletePastPlans()
    setLoading(false)

    if (res?.success) {
      alert(`Limpieza completada: ${res.count} registros borrados.`)
    } else {
      alert('Error al borrar.')
    }
  }

  return (
    <button 
      onClick={handleClean}
      disabled={disabled || loading}
      className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Eraser size={18} />}
      {loading ? 'Limpiando...' : 'Borrar Historial Pasado'}
    </button>
  )
}

// Botón para borrar una receta
export function DeleteRecipeButton({ id, name }: { id: string, name: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Borrar la receta "${name}"? Se borrará también del planificador.`)) return

    setLoading(true)
    const res = await deleteRecipe(id)
    setLoading(false)
    
    if (res?.error) alert('No se pudo borrar: ' + res.error)
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
      title="Borrar Receta"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  )
}