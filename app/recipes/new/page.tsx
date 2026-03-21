import { createClient } from '@/lib/supabase/server'
import RecipeForm from './RecipeForm'

export default async function NewRecipePage() {
  const supabase = await createClient()

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, preferred_store')
    .order('name', { ascending: true })

  return <RecipeForm ingredients={ingredients || []} />
}
