import { createClient } from '@/lib/supabase/server'
import ShoppingListClient from './shopping-list-ui'
import { ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShoppingListPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('*')
    .order('store', { ascending: true })
    .order('created_at', { ascending: true })

  // Tiendas únicas del catálogo de ingredientes para el selector manual
  const { data: ingredientsData } = await supabase
    .from('ingredients')
    .select('preferred_store')
    .not('preferred_store', 'is', null)

  const stores = Array.from(
    new Set((ingredientsData || []).map(i => i.preferred_store).filter(Boolean))
  ).sort() as string[]

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

      <ShoppingListClient initialItems={items || []} stores={stores} />
    </div>
  )
}
