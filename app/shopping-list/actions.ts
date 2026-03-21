'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. AÑADIR ITEM MANUAL
export async function addItem(name: string, store: string = 'Sin tienda') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ name, store, is_manual: true, checked: false })

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

// 4. VACIAR TODA LA LISTA
export async function clearList() {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .not('id', 'is', null)

  if (error) console.error('Error al vaciar lista:', error)
  revalidatePath('/shopping-list')
}

// 5. IMPORTAR INGREDIENTES DESDE EL PLANIFICADOR (con tienda)
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

  // 3. Extraer y limpiar los datos
  type IngredientRow = {
    ingredients: { name: string; preferred_store: string | null } | { name: string; preferred_store: string | null }[] | null
  }

  const allIngredients: { name: string; store: string }[] = []
  recipeData.forEach((item: IngredientRow) => {
    const ingredient = Array.isArray(item.ingredients)
      ? item.ingredients[0]
      : item.ingredients

    if (ingredient?.name) {
      allIngredients.push({
        name: ingredient.name,
        store: ingredient.preferred_store || 'Sin tienda',
      })
    }
  })

  if (allIngredients.length === 0) {
    return { error: 'Las recetas no tienen ingredientes vinculados en la tabla recipe_ingredients.' }
  }

  // 4. Borrar los ítems importados anteriormente (is_manual = false)
  //    Los ítems manuales del usuario se mantienen intactos
  const { error: deleteError } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('is_manual', false)

  if (deleteError) {
    return { error: `Error al limpiar importados anteriores: ${deleteError.message}` }
  }

  // 5. Insertar frescos con la tienda actual de cada ingrediente
  const itemsToInsert = allIngredients.map(({ name, store }) => ({
    name,
    store,
    is_manual: false,
    checked: false,
  }))

  const { error: insertError } = await supabase
    .from('shopping_list_items')
    .insert(itemsToInsert)

  if (insertError) {
    return { error: `Error al volcar: ${insertError.message}` }
  }

  revalidatePath('/shopping-list')
  return { success: true, count: itemsToInsert.length }
}
