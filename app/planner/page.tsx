import { createClient } from '@/lib/supabase/server'
import PlannerContainer from './planner-ui'

export const dynamic = 'force-dynamic'

export default async function PlannerPage() {
  const supabase = await createClient()

  // Filtramos desde ayer para no ver cosas muy viejas, pero mantener la semana en curso
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateFilter = yesterday.toISOString().split('T')[0]

  // 1. Obtener Planes
  const { data: rawPlan } = await supabase
    .from('weekly_plan')
    .select(`
      day_date, 
      meal_type, 
      recipe_id,
      recipes (name)
    `)
    .gte('day_date', dateFilter)
    .order('day_date', { ascending: true })

  // 2. Obtener Recetas para el selector
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, name')
    .order('name')

  // === CORRECCIÓN DEL ERROR DE TIPOS ===
  // Transformamos los datos para asegurar que 'recipes' sea un objeto y no un array
  const cleanPlan = rawPlan?.map((item: any) => ({
    day_date: item.day_date,
    meal_type: item.meal_type,
    recipe_id: item.recipe_id,
    // Si Supabase devuelve array, cogemos el primero. Si devuelve objeto, lo dejamos.
    recipes: Array.isArray(item.recipes) ? item.recipes[0] : item.recipes
  })) || []

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto w-full">
      <PlannerContainer 
        recipes={recipes || []} 
        initialPlan={cleanPlan} 
      />
    </div>
  )
}