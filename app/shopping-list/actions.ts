'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. AÑADIR ITEM MANUAL
export async function addItem(name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ name, is_manual: true, checked: false })

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

// 4. VACIAR TODA LA LISTA (El que faltaba)
export async function clearList() {
  const supabase = await createClient()
  // Borramos todos los registros de la tabla
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .neq('name', 'NUNCA_EXISTIRA_ESTO') // Truco para borrar todo sin filtrar por ID

  if (error) console.error('Error al vaciar lista:', error)
  revalidatePath('/shopping-list')
}

// 5. IMPORTAR INGREDIENTES DESDE EL PLANIFICADOR
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

  // 2. Obtener los nombres de los ingredientes a través de la tabla intermedia
  // Consultamos 'recipe_ingredients' y saltamos a la tabla 'ingredients' para el nombre
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipe_ingredients')
    .select(`
      ingredients (
        name
      )
    `)
    .in('recipe_id', recipeIds)

  if (recipeError) return { error: `Error en ingredientes: ${recipeError.message}` }

  // 3. Extraer y limpiar los nombres
  const allIngredients: string[] = []
  recipeData.forEach((item: any) => {
    // Dependiendo de cómo esté la FK, puede venir como objeto o array
    const ingredientName = Array.isArray(item.ingredients) 
      ? item.ingredients[0]?.name 
      : item.ingredients?.name

    if (ingredientName) {
      allIngredients.push(ingredientName)
    }
  })

  if (allIngredients.length === 0) {
    return { error: 'Las recetas no tienen ingredientes vinculados en la tabla recipe_ingredients.' }
  }

 // 4. Insertar en la lista de la compra
  const itemsToInsert = allIngredients.map(name => ({
    name: name,
    is_manual: false,
    checked: false
    // Si tu tabla tiene columnas obligatorias como 'user_id', 
    // deberíamos añadirlas aquí.
  }))

  const { error: insertError } = await supabase
    .from('shopping_list_items')
    .insert(itemsToInsert)

  if (insertError) {
    console.error('DETALLE DEL ERROR AL INSERTAR:', insertError)
    // Esto nos dirá si falta una columna o si es un tema de permisos
    return { error: `Error al volcar: ${insertError.message} (${insertError.details || 'sin detalles'})` }
  }

  revalidatePath('/shopping-list')
  return { success: true, count: itemsToInsert.length }
}