'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Borrar planes anteriores a hoy (Limpieza)
export async function deletePastPlans() {
  const supabase = await createClient()
  
  // Obtenemos la fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const { error, count } = await supabase
    .from('weekly_plan')
    .delete({ count: 'exact' })
    .lt('day_date', today) // lt = "less than" (menor que hoy)

  if (error) return { error: error.message }
  
  revalidatePath('/planner')
  revalidatePath('/admin')
  return { success: true, count }
}

// Borrar una receta específica
export async function deleteRecipe(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  revalidatePath('/admin')
  return { success: true }
}