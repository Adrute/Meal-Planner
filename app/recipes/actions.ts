'use server'

import { createClient } from '@/lib/supabase/server'
import { RecipeSchema, RecipeFormValues } from '@/types/schema'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createRecipe(data: RecipeFormValues) {
  const supabase = await createClient()

  // 1. Validar que los datos son correctos
  const result = RecipeSchema.safeParse(data)
  
  if (!result.success) {
    return { error: "Datos inválidos: Revisa los campos rojos." }
  }
  
  const { name, steps, ingredients } = result.data

  try {
    // 2. Insertar la Receta
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name,
        steps: steps.map(s => s.text), // Guardamos array de textos
        instructions: steps.map(s => s.text).join('\n'), 
      })
      .select('id')
      .single()

    if (recipeError) throw new Error(`Error receta: ${recipeError.message}`)
    const recipeId = recipeData.id

    // 3. Procesar Ingredientes uno a uno
    for (const item of ingredients) {
      let ingredientId

      // a. Buscar si el ingrediente ya existe
      const { data: existingIng } = await supabase
        .from('ingredients')
        .select('id')
        .ilike('name', item.name)
        .single()

      if (existingIng) {
        ingredientId = existingIng.id
      } else {
        // b. Si no existe, crearlo
        const { data: newIng, error: createIngError } = await supabase
          .from('ingredients')
          .insert({ 
            name: item.name, 
            preferred_store: item.store || 'General' 
          })
          .select('id')
          .single()
        
        if (createIngError) throw createIngError
        ingredientId = newIng.id
      }

      // c. Vincular ingrediente con la receta
      await supabase
        .from('recipe_ingredients')
        .insert({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          amount: item.amount
        })
    }

  } catch (error) {
    console.error('Error creando receta:', error)
    return { error: 'Hubo un error al guardar la receta en la base de datos.' }
  }

  // 4. Redirigir al listado
  revalidatePath('/recipes')
  redirect('/recipes')
}