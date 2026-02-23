'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. ASIGNAR COMIDA (Crear o Actualizar)
export async function assignMeal(date: string, mealType: string, recipeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_plan')
    .upsert(
      { day_date: date, meal_type: mealType, recipe_id: recipeId },
      { onConflict: 'day_date, meal_type' }
    )

  if (error) {
    console.error('Error assigning meal:', error)
  }

  // Actualizamos ambas rutas para que el dashboard refleje cambios al instante
  revalidatePath('/planner')
  revalidatePath('/')
}

// 2. BORRAR COMIDA INDIVIDUAL (La que te falta)
export async function removeMeal(date: string, mealType: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_plan')
    .delete()
    .match({ day_date: date, meal_type: mealType })

  if (error) {
    console.error('Error removing meal:', error)
  }

  revalidatePath('/planner')
  revalidatePath('/')
}

// 3. BORRAR SEMANA COMPLETA
export async function deleteWeekPlan(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_plan')
    .delete()
    .gte('day_date', startDate)
    .lte('day_date', endDate)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/planner')
  revalidatePath('/')
  return { success: true }
}