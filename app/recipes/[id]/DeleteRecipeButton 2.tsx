'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { deleteRecipe } from '../actions'

export default function DeleteRecipeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('¿Borrar esta receta? Esta acción no se puede deshacer.')) return
    startTransition(() => deleteRecipe(id))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
    >
      <Trash2 size={15} /> {isPending ? 'Borrando...' : 'Borrar'}
    </button>
  )
}
