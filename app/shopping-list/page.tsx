import { createClient } from '@/lib/supabase/server'
import { ShoppingBasket, Store, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { toggleItem, clearCompleted } from './actions'

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ShoppingListPage() {
  const supabase = await createClient()

  // Obtenemos la lista ordenada
  const { data: items } = await supabase
    .from('shopping_list')
    .select('*')
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false })

  const pendingItems = items?.filter(i => !i.is_completed) || []
  const completedItems = items?.filter(i => i.is_completed) || []

  // Agrupamos los elementos pendientes por Tienda
  const groupedByStore = pendingItems.reduce((acc, item) => {
    const store = item.store || 'Supermercado';
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in pb-24 md:pb-12">
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Lista de Compra</h1>
          <p className="text-slate-500 font-medium mt-1">Organizada automáticamente por establecimientos.</p>
        </div>
        <Link href="/ingredients" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">
          <Store size={18} /> Gestionar Tiendas
        </Link>
      </header>

      {pendingItems.length === 0 && completedItems.length === 0 && (
        <div className="text-center py-20 text-slate-400 font-medium bg-white rounded-3xl border border-slate-200 shadow-sm">
          <ShoppingBasket size={48} className="mx-auto mb-4 opacity-20" />
          <p>Tu lista está vacía.</p>
        </div>
      )}

      {/* BLOQUES POR TIENDA */}
      <div className="space-y-8">
        {Object.entries(groupedByStore).map(([store, items]) => {
          // Le decimos a TypeScript que items es un array sin forzar el map
          const storeItems = items as any[];

          return (
            <div key={store} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store size={20} className="text-emerald-500" /> {store}
              </h2>

              <div className="space-y-1">
                {storeItems.map((item: any) => (
                  <form key={item.id} action={toggleItem.bind(null, item.id, item.is_completed)}>
                    <button type="submit" className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                      <Circle size={22} className="text-slate-300 group-hover:text-emerald-500 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-slate-700">{item.name}</span>
                        {item.quantity && <span className="ml-2 text-sm text-slate-400">({item.quantity})</span>}
                      </div>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ELEMENTOS COMPRADOS */}
      {completedItems.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-500 flex items-center gap-2">
              <CheckCircle2 size={18} /> Ya en el carro
            </h3>
            <form action={clearCompleted}>
              <button type="submit" className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                <Trash2 size={14} /> Limpiar
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 opacity-75">
            <div className="space-y-1">
              {completedItems.map(item => (
                <form key={item.id} action={toggleItem.bind(null, item.id, item.is_completed)}>
                  <button type="submit" className="w-full flex items-center gap-4 p-3 hover:bg-slate-100 rounded-xl transition-colors text-left">
                    <CheckCircle2 size={22} className="text-emerald-500 flex-shrink-0" />
                    <span className="font-medium text-slate-400 line-through">{item.name}</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}