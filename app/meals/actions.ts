'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Restriction = {
  food: string
  type: 'alergia' | 'intolerancia' | 'preferencia'
}

export type HouseholdMember = {
  id: string
  name: string
  role: 'adult' | 'child'
  birth_year: number | null
  restrictions: Restriction[]
}

export type SchoolMenuItem = {
  id: string
  date: string
  first_course: string | null
  second_course: string | null
  dessert: string | null
}

// ─── Weekly plan ─────────────────────────────────────────────────────────────

export async function assignMeal(date: string, mealType: string, recipeId: string) {
  const supabase = await createClient()
  await supabase.from('weekly_plan').upsert(
    { day_date: date, meal_type: mealType, recipe_id: recipeId },
    { onConflict: 'day_date, meal_type' }
  )
  revalidatePath('/meals')
  revalidatePath('/')
}

export async function assignMealByName(
  date: string,
  mealType: string,
  recipeName: string,
  existingRecipeId?: string | null,
  aiNotes?: string | null,
) {
  const supabase = await createClient()

  let recipeId = existingRecipeId

  if (!recipeId) {
    const { data } = await supabase
      .from('recipes')
      .insert([{ name: recipeName }])
      .select('id')
      .single()
    recipeId = data?.id ?? null
  }

  if (!recipeId) return { error: 'No se pudo crear la receta' }

  await supabase.from('weekly_plan').upsert(
    { day_date: date, meal_type: mealType, recipe_id: recipeId, ai_notes: aiNotes ?? null },
    { onConflict: 'day_date, meal_type' }
  )

  revalidatePath('/meals')
  revalidatePath('/')
  return { success: true }
}

export async function removeMeal(date: string, mealType: string) {
  const supabase = await createClient()
  await supabase.from('weekly_plan').delete().match({ day_date: date, meal_type: mealType })
  revalidatePath('/meals')
  revalidatePath('/')
}

export async function deleteWeekPlan(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('weekly_plan')
    .delete()
    .gte('day_date', startDate)
    .lte('day_date', endDate)

  if (error) return { success: false, error: error.message }
  revalidatePath('/meals')
  revalidatePath('/')
  return { success: true }
}

// ─── Household members ────────────────────────────────────────────────────────

export async function createHouseholdMember(data: {
  name: string
  role: 'adult' | 'child'
  birth_year?: number | null
  restrictions: Restriction[]
}) {
  const supabase = await createClient()
  await supabase.from('household_members').insert([data])
  revalidatePath('/meals')
}

export async function updateHouseholdMember(
  id: string,
  data: { name: string; role: 'adult' | 'child'; birth_year?: number | null; restrictions: Restriction[] }
) {
  const supabase = await createClient()
  await supabase.from('household_members').update(data).eq('id', id)
  revalidatePath('/meals')
}

export async function deleteHouseholdMember(id: string) {
  const supabase = await createClient()
  await supabase.from('household_members').delete().eq('id', id)
  revalidatePath('/meals')
}

// ─── School menu ──────────────────────────────────────────────────────────────

export async function saveSchoolMenuItems(
  items: Array<{ date: string; first_course: string; second_course: string; dessert: string }>
) {
  const supabase = await createClient()
  await supabase.from('school_menu_items').upsert(items, { onConflict: 'date' })
  revalidatePath('/meals')
}
