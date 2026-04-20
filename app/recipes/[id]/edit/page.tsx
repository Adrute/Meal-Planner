import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipeForm from '../../RecipeForm'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: recipe }, { data: ingredients }] = await Promise.all([
    supabase
      .from('recipes')
      .select('*, recipe_ingredients(amount, ingredients(id, name, preferred_store))')
      .eq('id', id)
      .single(),
    supabase
      .from('ingredients')
      .select('id, name, preferred_store')
      .order('name', { ascending: true }),
  ])

  if (!recipe) notFound()

  const defaultValues = {
    name: recipe.name,
    category: recipe.category ?? '',
    prep_time: recipe.prep_time ?? undefined,
    steps: (recipe.steps as string[]).map((text: string) => ({ text })),
    ingredients: recipe.recipe_ingredients.map((ri: any) => ({
      ingredient_id: ri.ingredients.id,
      name: ri.ingredients.name,
      amount: ri.amount,
      store: ri.ingredients.preferred_store ?? '',
    })),
  }

  return (
    <RecipeForm
      ingredients={ingredients || []}
      mode="edit"
      recipeId={id}
      defaultValues={defaultValues}
    />
  )
}
