'use server'

import { createClient } from '@/lib/supabase/server'
import { RecipeSchema, RecipeFormValues } from '@/types/schema'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createRecipe(data: RecipeFormValues) {
  const supabase = await createClient()

  const result = RecipeSchema.safeParse(data)
  if (!result.success) {
    return { error: "Datos inválidos: Revisa los campos rojos." }
  }

  const { name, steps, ingredients } = result.data

  try {
    // 1. Insertar la receta
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name,
        steps: steps.map(s => s.text),
        instructions: steps.map(s => s.text).join('\n'),
      })
      .select('id')
      .single()

    if (recipeError) throw new Error(`Error receta: ${recipeError.message}`)
    const recipeId = recipeData.id

    // 2. Procesar ingredientes
    for (const item of ingredients) {
      let ingredientId: string

      if (item.ingredient_id) {
        // Seleccionado del catálogo: usar directamente
        ingredientId = item.ingredient_id
      } else {
        // Nuevo ingrediente: buscar por nombre o crear
        const { data: existing } = await supabase
          .from('ingredients')
          .select('id')
          .ilike('name', item.name.trim())
          .single()

        if (existing) {
          ingredientId = existing.id
        } else {
          const { data: newIng, error: createIngError } = await supabase
            .from('ingredients')
            .insert({
              name: item.name.trim(),
              preferred_store: item.store || null,
            })
            .select('id')
            .single()

          if (createIngError) throw createIngError
          ingredientId = newIng.id
        }
      }

      // 3. Vincular ingrediente con la receta
      await supabase
        .from('recipe_ingredients')
        .insert({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          amount: item.amount,
        })
    }

  } catch (error) {
    console.error('Error creando receta:', error)
    return { error: 'Hubo un error al guardar la receta en la base de datos.' }
  }

  revalidatePath('/recipes')
  revalidatePath('/ingredients')
  redirect('/recipes')
}
