'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Función para añadir ingredientes a la lista sin duplicar y asignando la tienda
export async function addSmartIngredients(ingredientsToAdd: { name: string, quantity: string }[]) {
  const supabase = await createClient()

  // 1. Obtenemos todo el catálogo de preferencias para saber dónde comprar cada cosa
  const { data: catalog } = await supabase.from('ingredients').select('*')
  
  // 2. Obtenemos la lista de la compra actual (solo los no comprados) para no duplicar
  const { data: currentList } = await supabase
    .from('shopping_list')
    .select('name')
    .eq('is_completed', false)

  const currentNames = currentList?.map(item => item.name.toLowerCase()) || []

  // 3. Filtramos y preparamos los nuevos elementos
  const newItems = []
  
  for (const item of ingredientsToAdd) {
    const itemNameLower = item.name.toLowerCase()
    
    // Si ya está en la lista de la compra activa, lo ignoramos (Deduplicación)
    if (currentNames.includes(itemNameLower)) continue

    // Buscamos si tenemos una tienda preferida en el catálogo
    const catalogItem = catalog?.find(c => c.name.toLowerCase() === itemNameLower)
    const store = catalogItem ? catalogItem.preferred_store : 'Supermercado'

    newItems.push({
      name: item.name,
      quantity: item.quantity,
      store: store,
      is_completed: false
    })
  }

  // 4. Insertamos solo los ingredientes nuevos ya categorizados
  if (newItems.length > 0) {
    await supabase.from('shopping_list').insert(newItems)
  }

  revalidatePath('/shopping-list')
}

// Función para marcar como comprado
export async function toggleItem(id: string, currentState: boolean) {
  const supabase = await createClient()
  await supabase.from('shopping_list').update({ is_completed: !currentState }).eq('id', id)
  revalidatePath('/shopping-list')
}

// Función para limpiar los comprados
export async function clearCompleted() {
  const supabase = await createClient()
  await supabase.from('shopping_list').delete().eq('is_completed', true)
  revalidatePath('/shopping-list')
}