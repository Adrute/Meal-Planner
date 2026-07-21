'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const normalizeKey = (name: string, store: string) =>
  `${name.trim().toLowerCase()}|${(store || 'Sin tienda').trim().toLowerCase()}`

async function getNextPosition(supabase: SupabaseClient, store: string) {
  const { data } = await supabase
    .from('shopping_list_items')
    .select('position')
    .eq('store', store)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = data && data[0] ? data[0].position ?? -1 : -1
  return maxPosition + 1
}

// 1. AÑADIR ITEM MANUAL
export async function addItem(name: string, store: string = 'Sin tienda') {
  const supabase = await createClient()
  const position = await getNextPosition(supabase, store)
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ name, store, is_manual: true, checked: false, position })

  if (error) console.error('Error al añadir:', error)
  revalidatePath('/shopping-list')
}

// 2. TACHAR/DESTACHAR ITEM
export async function toggleItem(id: string, checked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ checked })
    .eq('id', id)

  if (error) console.error('Error al actualizar:', error)
  revalidatePath('/shopping-list')
}

// 3. BORRAR ITEM INDIVIDUAL
export async function deleteItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) console.error('Error al borrar:', error)
  revalidatePath('/shopping-list')
}

// 4. REORDENAR ITEMS DENTRO DE UNA TIENDA
export async function reorderItems(storeName: string, orderedIds: string[]) {
  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('shopping_list_items')
      .update({ position: index })
      .eq('id', id)
      .eq('store', storeName)
  )

  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/shopping-list')
  return { success: true }
}

// 5. ASIGNAR/LIMPIAR SUBGRUPO DE UN ITEM
export async function setSubgroup(itemId: string, subgroup: string | null) {
  const supabase = await createClient()
  const cleanSubgroup = subgroup && subgroup.trim() !== '' ? subgroup.trim() : null

  const { error } = await supabase
    .from('shopping_list_items')
    .update({ subgroup: cleanSubgroup })
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/shopping-list')
  return { success: true }
}

// 5b. MOVER ITEM A OTRO SUBGRUPO (drag cross-container) + reordenar destino, en una sola transacción de servidor
export async function moveItemToSubgroup(
  itemId: string,
  newSubgroup: string | null,
  storeName: string,
  orderedIdsOfDestination: string[]
) {
  const supabase = await createClient()
  const cleanSubgroup = newSubgroup && newSubgroup.trim() !== '' ? newSubgroup.trim() : null

  const { error: subgroupError } = await supabase
    .from('shopping_list_items')
    .update({ subgroup: cleanSubgroup })
    .eq('id', itemId)
    .eq('store', storeName)

  if (subgroupError) return { error: subgroupError.message }

  const updates = orderedIdsOfDestination.map((id, index) =>
    supabase
      .from('shopping_list_items')
      .update({ position: index })
      .eq('id', id)
      .eq('store', storeName)
  )

  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/shopping-list')
  return { success: true }
}

// 6. VACIAR TODA LA LISTA
export async function clearList() {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .not('id', 'is', null)

  if (error) console.error('Error al vaciar lista:', error)
  revalidatePath('/shopping-list')
}

// 7. IMPORTAR INGREDIENTES DESDE EL PLANIFICADOR (con tienda)
export async function importWeekIngredients() {
  const supabase = await createClient()

  const todayStr = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  // 1. Obtener los IDs de las recetas planificadas
  const { data: plan, error: planError } = await supabase
    .from('weekly_plan')
    .select('recipe_id')
    .gte('day_date', todayStr)
    .lte('day_date', nextWeekStr)

  if (planError) return { error: `Error en plan: ${planError.message}` }
  if (!plan || plan.length === 0) return { error: 'No hay nada planificado para esta semana.' }

  const recipeIds = Array.from(new Set(plan.map(p => p.recipe_id))).filter(Boolean)

  // 2. Obtener nombre y tienda de los ingredientes a través de la tabla intermedia
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipe_ingredients')
    .select(`
      ingredients (
        name,
        preferred_store
      )
    `)
    .in('recipe_id', recipeIds)

  if (recipeError) return { error: `Error en ingredientes: ${recipeError.message}` }

  // 3. Extraer y limpiar los datos, deduplicando por (nombre, tienda) normalizados
  type IngredientRow = {
    ingredients: { name: string; preferred_store: string | null } | { name: string; preferred_store: string | null }[] | null
  }

  const freshByKey = new Map<string, { name: string; store: string }>()
  recipeData.forEach((item: IngredientRow) => {
    const ingredient = Array.isArray(item.ingredients)
      ? item.ingredients[0]
      : item.ingredients

    if (ingredient?.name) {
      const store = ingredient.preferred_store || 'Sin tienda'
      const key = normalizeKey(ingredient.name, store)
      if (!freshByKey.has(key)) {
        freshByKey.set(key, { name: ingredient.name, store })
      }
    }
  })

  if (freshByKey.size === 0) {
    return { error: 'Las recetas no tienen ingredientes vinculados en la tabla recipe_ingredients.' }
  }

  // 4. Cargar los ítems importados actualmente para hacer el merge
  //    Los ítems manuales del usuario nunca se tocan
  const { data: currentImported, error: currentError } = await supabase
    .from('shopping_list_items')
    .select('id, name, store')
    .eq('is_manual', false)

  if (currentError) return { error: `Error al leer importados actuales: ${currentError.message}` }

  const currentKeys = new Set(
    (currentImported || []).map(row => normalizeKey(row.name, row.store || 'Sin tienda'))
  )

  // 5. Borrar los ítems importados que ya no están en el plan de esta semana
  //    (los que sí siguen apareciendo se conservan intactos: subgroup y position se mantienen)
  const idsToDelete = (currentImported || [])
    .filter(row => !freshByKey.has(normalizeKey(row.name, row.store || 'Sin tienda')))
    .map(row => row.id)

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('shopping_list_items')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) return { error: `Error al limpiar importados obsoletos: ${deleteError.message}` }
  }

  // 6. Insertar solo los ingredientes que no existían ya, al final de su tienda
  const newIngredients = Array.from(freshByKey.values()).filter(
    ({ name, store }) => !currentKeys.has(normalizeKey(name, store))
  )

  if (newIngredients.length > 0) {
    const { data: existingPositions, error: posError } = await supabase
      .from('shopping_list_items')
      .select('store, position')

    if (posError) return { error: `Error al calcular posiciones: ${posError.message}` }

    const maxPositionByStore = new Map<string, number>()
    ;(existingPositions || []).forEach(row => {
      const store = row.store || 'Sin tienda'
      const pos = row.position ?? -1
      if (pos > (maxPositionByStore.get(store) ?? -1)) maxPositionByStore.set(store, pos)
    })

    const itemsToInsert = newIngredients.map(({ name, store }) => {
      const position = (maxPositionByStore.get(store) ?? -1) + 1
      maxPositionByStore.set(store, position)
      return {
        name,
        store,
        is_manual: false,
        checked: false,
        subgroup: null,
        position,
      }
    })

    const { error: insertError } = await supabase
      .from('shopping_list_items')
      .insert(itemsToInsert)

    if (insertError) return { error: `Error al volcar: ${insertError.message}` }
  }

  revalidatePath('/shopping-list')
  return { success: true, added: newIngredients.length, total: freshByKey.size }
}
