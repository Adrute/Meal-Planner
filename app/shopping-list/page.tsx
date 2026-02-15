import { createClient } from '@/lib/supabase/server'
import ShoppingListClient from './shopping-list-ui' // Componente cliente que crearemos ahora
import { ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShoppingListPage() {
  const supabase = await createClient()

  // 1. Obtener items manuales guardados
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. (Fase futura) Aquí leeríamos el plan semanal para sugerir ingredientes
  // Por ahora empezamos con la lista manual básica.

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 pb-24">
      <header className="mb-8 flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
          <ShoppingCart size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lista de Compra</h1>
          <p className="text-slate-500 font-medium">No te olvides de nada.</p>
        </div>
      </header>

      {/* Componente Interactivo */}
      <ShoppingListClient initialItems={items || []} />
    </div>
  )
}