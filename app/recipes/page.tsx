import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, ChefHat, Clock, BookOpen } from "lucide-react";

export default async function RecipesPage() {
  const supabase = await createClient();

  // 1. Pedimos las recetas a Supabase incluyendo el conteo de ingredientes
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar recetas:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
        Error cargando el recetario. Revisa tu conexión.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24">
      {/* Cabecera Principal */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recetario</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {recipes?.length || 0} platos guardados
          </p>
        </div>
        
        {/* Botón Nueva Receta */}
        <Link
          href="/recipes/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-emerald-200 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span className="hidden md:inline">Nueva Receta</span>
        </Link>
      </div>

      {/* Grid de Recetas */}
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe: any) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        /* Estado Vacío (Empty State) - Se muestra si no hay recetas */
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <BookOpen size={32} className="text-emerald-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tu libro está vacío</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 mb-6">
            Empieza a guardar tus platos favoritos para organizar tu semana.
          </p>
          <Link
            href="/recipes/new"
            className="text-emerald-600 font-bold text-sm hover:underline"
          >
            + Crear mi primera receta
          </Link>
        </div>
      )}
    </div>
  );
}

// Componente Tarjeta de Receta (Con Link integrado)
function RecipeCard({ recipe }: { recipe: any }) {
  // Generamos un degradado visual basado en la longitud del nombre para variar
  const gradients = [
    "from-orange-400 to-orange-600",
    "from-emerald-400 to-emerald-600",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
  ];
  const randomGradient = gradients[recipe.name.length % gradients.length];
  
  // Obtenemos el conteo de ingredientes de forma segura
  const ingredientCount = recipe.recipe_ingredients?.[0]?.count || 0;

  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full">
      <div className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
        
        {/* Imagen / Icono decorativo */}
        <div className={`h-32 rounded-xl bg-gradient-to-br ${randomGradient} flex items-center justify-center mb-4 text-white shadow-inner shrink-0 group-hover:scale-[1.02] transition-transform duration-300`}>
          <ChefHat size={36} className="opacity-90 drop-shadow-md" />
        </div>

        {/* Contenido de la tarjeta */}
        <div className="flex flex-col flex-1 justify-between">
          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-3 line-clamp-2">
            {recipe.name}
          </h3>
          
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <Clock size={12} /> 30 min
            </span>
            <span className="flex items-center gap-1">
               📦 {ingredientCount} ingr.
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}