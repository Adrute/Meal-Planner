import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Clock, BookOpen, Star } from 'lucide-react'

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
        <div className="space-y-12">
          {Object.entries(grouped)
            .sort(([a], [b]) => a === 'Sin categoría' ? 1 : b === 'Sin categoría' ? -1 : a.localeCompare(b))
            .map(([cat, items]) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <span className="text-lg">{CATEGORY_EMOJI[cat] ?? '🍽️'}</span>
                  <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">{cat}</h2>
                  <span className="text-xs font-bold text-slate-300 ml-1">({items.length})</span>
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

const CATEGORY_EMOJI: Record<string, string> = {
  'Pasta': '🍝',
  'Arroces': '🍚',
  'Carnes': '🥩',
  'Pescado': '🐟',
  'Verduras': '🥦',
  'Legumbres': '🫘',
  'Sopas': '🍲',
  'Huevos': '🥚',
  'Ensaladas': '🥗',
  'Postres': '🍰',
  'Otros': '🍴',
  'Sin categoría': '🍽️',
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const ingredientCount = recipe.recipe_ingredients?.[0]?.count || 0
  const emoji = CATEGORY_EMOJI[recipe.category ?? ''] ?? '🍽️'

  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full">
      <div className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative h-full flex flex-col gap-3">
        {recipe.is_favorite && (
          <div className="absolute top-3 right-3 text-amber-400">
            <Star size={15} fill="currentColor" />
          </div>
        )}

        {/* Emoji grande como visual principal */}
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
          {emoji}
        </div>

        <div className="flex flex-col flex-1 justify-between gap-2">
          <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 pr-4">{recipe.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {recipe.prep_time ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Clock size={11} /> {recipe.prep_time} min
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                {ingredientCount} ingredientes
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
