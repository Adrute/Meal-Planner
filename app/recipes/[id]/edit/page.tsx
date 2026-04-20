import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipeForm from '../../RecipeForm'

const KNOWN_UNITS = ['g', 'kg', 'ml', 'l', 'dl', 'cl', 'taza', 'tazas', 'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas', 'ud', 'uds', 'al gusto', 'unidad', 'unidades', 'lata', 'latas', 'puñado', 'puñados', 'rodaja', 'rodajas', 'diente', 'dientes']

function parseAmount(raw: string): { amount: string; unit: string } {
  const str = raw.trim()
  const lastSpace = str.lastIndexOf(' ')
  if (lastSpace === -1) return { amount: str, unit: '' }
  const potentialUnit = str.slice(lastSpace + 1).toLowerCase()
  if (KNOWN_UNITS.includes(potentialUnit)) {
    return { amount: str.slice(0, lastSpace), unit: potentialUnit }
  }
  return { amount: str, unit: '' }
}

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
    ingredients: recipe.recipe_ingredients.map((ri: any) => {
      const parsed = parseAmount(ri.amount)
      return {
        ingredient_id: ri.ingredients.id,
        name: ri.ingredients.name,
        amount: parsed.amount,
        unit: parsed.unit,
        store: ri.ingredients.preferred_store ?? '',
      }
    }),
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
