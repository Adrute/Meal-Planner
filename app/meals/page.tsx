import { createClient } from '@/lib/supabase/server'
import PlannerContainer from './planner-ui'
import SchoolMenuSection from './school-menu-section'
import HouseholdMembersSection from './household-members-section'

export const dynamic = 'force-dynamic'

export default async function PlannerPage() {
  const supabase = await createClient()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateFilter = yesterday.toISOString().split('T')[0]

  const [
    { data: rawPlan },
    { data: recipes },
    { data: householdMembers },
    { data: schoolMenuItems },
  ] = await Promise.all([
    supabase
      .from('weekly_plan')
      .select('day_date, meal_type, recipe_id, recipes (name)')
      .gte('day_date', dateFilter)
      .order('day_date', { ascending: true }),
    supabase.from('recipes').select('id, name').order('name'),
    supabase.from('household_members').select('*').order('created_at'),
    supabase.from('school_menu_items').select('*').order('date'),
  ])

  const cleanPlan = rawPlan?.map(item => ({
    day_date: item.day_date,
    meal_type: item.meal_type,
    recipe_id: item.recipe_id,
    recipes: Array.isArray(item.recipes) ? item.recipes[0] : item.recipes,
  })) ?? []

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto w-full space-y-8">
      <PlannerContainer
        recipes={recipes ?? []}
        initialPlan={cleanPlan}
        householdMembers={householdMembers ?? []}
        schoolMenuItems={schoolMenuItems ?? []}
      />
      <SchoolMenuSection items={schoolMenuItems ?? []} />
      <HouseholdMembersSection members={householdMembers ?? []} />
    </div>
  )
}
