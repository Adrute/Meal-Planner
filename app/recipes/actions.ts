'use server'

import { createClient } from '@/lib/supabase/server'
import { RecipeSchema, RecipeFormValues } from '@/types/schema'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function upsertIngredients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipeId: string,
  ingredients: RecipeFormValues['ingredients'],
) {
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)

  for (const item of ingredients) {
    let ingredientId: string

    if (item.ingredient_id) {
      ingredientId = item.ingredient_id
    } else {
      const { data: existing } = await supabase
        .from('ingredients')
        .select('id')
        .ilike('name', item.name.trim())
        .single()

      if (existing) {
        ingredientId = existing.id
      } else {
        const { data: newIng, error } = await supabase
          .from('ingredients')
          .insert({ name: item.name.trim(), preferred_store: item.store || null })
          .select('id')
          .single()
        if (error) throw error
        ingredientId = newIng.id
      }
    }

    const fullAmount = item.unit ? `${item.amount} ${item.unit}` : item.amount
    await supabase.from('recipe_ingredients').insert({
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      amount: fullAmount,
    })
  }
}

export async function createRecipe(data: RecipeFormValues) {
  const supabase = await createClient()
  const result = RecipeSchema.safeParse(data)
  if (!result.success) return { error: 'Datos inválidos: Revisa los campos rojos.' }

  const { name, category, prep_time, steps, ingredients } = result.data

  try {
    const { data: recipeData, error } = await supabase
      .from('recipes')
      .insert({
        name,
        category: category || null,
        prep_time: prep_time || null,
        steps: steps.map(s => s.text),
        instructions: steps.map(s => s.text).join('\n'),
      })
      .select('id')
      .single()

    if (error) throw error
    await upsertIngredients(supabase, recipeData.id, ingredients)
  } catch (e) {
    console.error('Error creando receta:', e)
    return { error: 'Hubo un error al guardar la receta.' }
  }

  revalidatePath('/recipes')
  redirect('/recipes')
}

export async function updateRecipe(id: string, data: RecipeFormValues) {
  const supabase = await createClient()
  const result = RecipeSchema.safeParse(data)
  if (!result.success) return { error: 'Datos inválidos: Revisa los campos rojos.' }

  const { name, category, prep_time, steps, ingredients } = result.data

  try {
    const { error } = await supabase
      .from('recipes')
      .update({
        name,
        category: category || null,
        prep_time: prep_time || null,
        steps: steps.map(s => s.text),
        instructions: steps.map(s => s.text).join('\n'),
      })
      .eq('id', id)

    if (error) throw error
    await upsertIngredients(supabase, id, ingredients)
  } catch (e) {
    console.error('Error editando receta:', e)
    return { error: 'Hubo un error al guardar los cambios.' }
  }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${id}`)
  redirect(`/recipes/${id}`)
}

export async function toggleFavorite(id: string, current: boolean) {
  const supabase = await createClient()
  await supabase.from('recipes').update({ is_favorite: !current }).eq('id', id)
  revalidatePath('/recipes')
  revalidatePath(`/recipes/${id}`)
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient()
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
  await supabase.from('recipes').delete().eq('id', id)
  revalidatePath('/recipes')
  redirect('/recipes')
}
