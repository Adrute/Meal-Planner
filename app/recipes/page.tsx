import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChefHat, Clock, BookOpen, Star, Tag } from 'lucide-react'

type Recipe = {
  id: string
  name: string
  category: string | null
  prep_time: number | null
  is_favorite: boolean
  recipe_ingredients: [{ count: number }]
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; favorites?: string }>
}) {
  const { category, favorites } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('recipes')
    .select('id, name, category, prep_time, is_favorite, recipe_ingredients(count)')
    .order('name', { ascending: true })

  if (favorites === '1') query = query.eq('is_favorite', true)
  if (category) query = query.eq('category', category)

  const { data: recipes, error } = await query

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
        Error cargando el recetario.
      </div>
    )
  }

  // Obtener categorías únicas para los tabs
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('category')
    .not('category', 'is', null)

  const categories = [...new Set((allRecipes || []).map(r => r.category).filter(Boolean))] as string[]

  // Agrupar por categoría (solo si no hay filtro activo)
  const showGrouped = !category && favorites !== '1'
  const grouped: Record<string, Recipe[]> = {}
  if (showGrouped && recipes) {
    for (const r of recipes) {
      const key = r.category || 'Sin categoría'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(r as Recipe)
    }
  }

  const totalFavorites = (recipes || []).filter(r => r.is_favorite).length

  return (
    <div className="p-4 md:p-8 pb-24">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recetario</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {recipes?.length || 0} platos guardados
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-emerald-200 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span className="hidden md:inline">Nueva Receta</span>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FilterLink href="/recipes" active={!category && favorites !== '1'}>
          Todas
        </FilterLink>
        <FilterLink href="/recipes?favorites=1" active={favorites === '1'}>
          <Star size={13} fill={favorites === '1' ? 'currentColor' : 'none'} />
          Favoritas {totalFavorites > 0 && `(${totalFavorites})`}
        </FilterLink>
        {categories.map(cat => (
          <FilterLink key={cat} href={`/recipes?category=${encodeURIComponent(cat)}`} active={category === cat}>
            {cat}
          </FilterLink>
        ))}
      </div>

      {/* Grid / Grupos */}
      {!recipes || recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <BookOpen size={32} className="text-emerald-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            {favorites === '1' ? 'Aún no tienes favoritas' : category ? `Sin recetas en "${category}"` : 'Tu libro está vacío'}
          </h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 mb-6">
            {favorites === '1' ? 'Marca recetas con ⭐ desde su detalle.' : 'Empieza a guardar tus platos favoritos.'}
          </p>
          {!favorites && (
            <Link href="/recipes/new" className="text-emerald-600 font-bold text-sm hover:underline">
              + Crear mi primera receta
            </Link>
          )}
        </div>
      ) : showGrouped ? (
        <div className="space-y-10">
          {Object.entries(grouped)
            .sort(([a], [b]) => a === 'Sin categoría' ? 1 : b === 'Sin categoría' ? -1 : a.localeCompare(b))
            .map(([cat, items]) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={14} className="text-slate-400" />
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{cat}</h2>
                  <span className="text-xs font-bold text-slate-300">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(r => <RecipeCard key={r.id} recipe={r} />)}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(recipes as Recipe[]).map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
      }`}
    >
      {children}
    </Link>
  )
}

const GRADIENTS = [
  'from-orange-400 to-orange-600',
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
]

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const gradient = GRADIENTS[recipe.name.length % GRADIENTS.length]
  const ingredientCount = recipe.recipe_ingredients?.[0]?.count || 0

  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full">
      <div className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative h-full flex flex-col">
        {recipe.is_favorite && (
          <div className="absolute top-3 right-3 z-10 text-amber-400">
            <Star size={16} fill="currentColor" />
          </div>
        )}
        <div className={`h-28 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 text-white shrink-0 group-hover:scale-[1.02] transition-transform duration-300`}>
          <ChefHat size={32} className="opacity-90 drop-shadow-md" />
        </div>
        <div className="flex flex-col flex-1 justify-between">
          <h3 className="font-bold text-slate-800 text-base leading-tight mb-2 line-clamp-2">{recipe.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {recipe.category && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {recipe.category}
              </span>
            )}
            {recipe.prep_time && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Clock size={10} /> {recipe.prep_time} min
              </span>
            )}
            {!recipe.prep_time && (
              <span className="text-[10px] font-medium text-slate-400">
                📦 {ingredientCount} ingr.
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
