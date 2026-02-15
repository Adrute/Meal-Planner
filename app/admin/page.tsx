import { createClient } from '@/lib/supabase/server'
// CAMBIO IMPORTANTE: Importación con llaves {}
import { DeletePlansButton, DeleteRecipeButton } from './admin-client'
import { Database, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Obtener Estadísticas
  const { count: recipeCount } = await supabase.from('recipes').select('*', { count: 'exact', head: true })
  const { count: ingredientCount } = await supabase.from('ingredients').select('*', { count: 'exact', head: true })
  
  // 2. Obtener Lista de Recetas Completa
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  // 3. Obtener Planes Antiguos
  const today = new Date().toISOString().split('T')[0]
  const { count: oldPlansCount } = await supabase
    .from('weekly_plan')
    .select('*', { count: 'exact', head: true })
    .lt('day_date', today)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <Database className="text-emerald-600" />
        Panel de Administración
      </h1>

      {/* PANEL DE MANTENIMIENTO */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        
        {/* Tarjeta de Limpieza */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Limpieza de Agenda</h2>
              <p className="text-sm text-slate-500">Borrar planes pasados para liberar espacio.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Planes anteriores a hoy:</span>
            <span className="text-xl font-bold text-slate-900">{oldPlansCount || 0}</span>
          </div>

          {/* CAMBIO: Uso directo del componente */}
          <DeletePlansButton disabled={!oldPlansCount || oldPlansCount === 0} />
        </div>

        {/* Tarjeta de Estadísticas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h2 className="font-bold text-lg mb-4">Estadísticas de BBDD</h2>
           <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <span className="text-slate-600">Total Recetas</span>
                <span className="font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{recipeCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <span className="text-slate-600">Total Ingredientes</span>
                <span className="font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{ingredientCount}</span>
              </div>
           </div>
        </div>
      </div>

      {/* TABLA DE GESTIÓN */}
      <h2 className="font-bold text-xl mb-4 text-slate-800">Gestión de Contenido</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="p-4 font-medium">Nombre de la Receta</th>
              <th className="p-4 font-medium hidden md:table-cell">ID</th>
              <th className="p-4 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recipes?.map((recipe: any) => (
              <tr key={recipe.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-medium text-slate-800">{recipe.name}</td>
                <td className="p-4 text-slate-400 font-mono text-xs hidden md:table-cell">{recipe.id}</td>
                <td className="p-4 text-right">
                  {/* CAMBIO: Uso directo del componente */}
                  <DeleteRecipeButton id={recipe.id} name={recipe.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!recipes || recipes.length === 0) && (
          <div className="p-8 text-center text-slate-400">No hay recetas en la base de datos.</div>
        )}
      </div>
    </div>
  )
}