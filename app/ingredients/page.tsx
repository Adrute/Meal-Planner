import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Trash2, Plus, ArrowLeft, Tags } from 'lucide-react'
import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

// Tiendas predefinidas que siempre aparecen como sugerencias
const DEFAULT_STORES = ['Mercadona', 'Lidl', 'Aldi', 'Carrefour', 'El Corte Inglés', 'Alcampo', 'Día', 'Supermercado']

export default async function IngredientsCatalog() {
  const supabase = await createClient()

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  // Combinar tiendas predefinidas con las ya usadas (sin duplicados)
  const usedStores = (ingredients || [])
    .map(ing => ing.preferred_store)
    .filter(Boolean) as string[]

  const allStores = Array.from(new Set([...DEFAULT_STORES, ...usedStores])).sort()

  async function addIngredient(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const preferred_store = formData.get('preferred_store') as string
    const supabase = await createClient()

    if (name?.trim()) {
      await supabase.from('ingredients').insert([{
        name: name.trim(),
        preferred_store: preferred_store?.trim() || null,
      }])
      revalidatePath('/ingredients')
    }
  }

  async function deleteIngredient(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = await createClient()
    await supabase.from('ingredients').delete().eq('id', id)
    revalidatePath('/ingredients')
  }

  async function updateStore(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const preferred_store = formData.get('preferred_store') as string
    const supabase = await createClient()

    await supabase.from('ingredients').update({
      preferred_store: preferred_store?.trim() || null,
    }).eq('id', id)

    revalidatePath('/ingredients')
    revalidatePath('/shopping-list')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in pb-24 md:pb-12">

      {/* datalist compartido para todas las tiendas */}
      <datalist id="store-options">
        {allStores.map(s => <option key={s} value={s} />)}
      </datalist>

      <header className="mb-10">
        <Link href="/shopping-list" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-500 transition-colors mb-4">
          <ArrowLeft size={16} /> Volver a la Lista
        </Link>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Tags className="text-emerald-500" /> Catálogo de Ingredientes
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Configura dónde prefieres comprar cada producto.
        </p>
      </header>

      {/* FORMULARIO AÑADIR */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-10">
        <form action={addIngredient} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Ingrediente</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Pechuga de Pollo"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Tienda / Sección</label>
            <input
              type="text"
              name="preferred_store"
              list="store-options"
              placeholder="Ej: Mercadona"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <SubmitButton
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
              loadingText="Añadiendo..."
            >
              <Plus size={18} /> Añadir
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {(!ingredients || ingredients.length === 0) ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Tu catálogo está vacío. Empieza a añadir ingredientes.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ingredients.map(ing => (
              <div
                key={ing.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-700">{ing.name}</span>

                <div className="flex items-center gap-2">
                  <form action={updateStore} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={ing.id} />
                    <input
                      type="text"
                      name="preferred_store"
                      list="store-options"
                      defaultValue={ing.preferred_store ?? ''}
                      placeholder="Sin tienda"
                      className="w-44 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 bg-white"
                    />
                    <SubmitButton
                      className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg whitespace-nowrap"
                      loadingText="..."
                      iconOnly={false}
                    >
                      Guardar
                    </SubmitButton>
                  </form>

                  <form action={deleteIngredient}>
                    <input type="hidden" name="id" value={ing.id} />
                    <SubmitButton
                      iconOnly
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 size={18} />
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
