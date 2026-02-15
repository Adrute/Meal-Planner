import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, ChefHat, CheckCircle2 } from "lucide-react";

// 1. CAMBIO IMPORTANTE: Definimos params como una Promesa
export default async function RecipeDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 2. CAMBIO IMPORTANTE: Esperamos (await) a que params se resuelva
  const { id } = await params;

  const supabase = await createClient();

  // 3. Usamos el 'id' que acabamos de extraer
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients (
        amount,
        ingredients (
          name,
          preferred_store
        )
      )
    `)
    .eq("id", id) // Aquí usamos la variable ya "desempaquetada"
    .single();

  if (error || !recipe) {
    notFound();
  }

  // --- El resto del renderizado es igual ---
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
      <nav className="mb-6">
        <Link 
          href="/recipes" 
          className="inline-flex items-center text-slate-500 hover:text-emerald-600 font-medium transition-colors"
        >
          <ChevronLeft size={20} /> Volver al recetario
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
          {recipe.name}
        </h1>
        
        <div className="flex gap-4 text-sm font-medium text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock size={16} /> 
            <span>30 min</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
            <ChefHat size={16} /> 
            <span>Fácil</span>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Ingredientes */}
        <div className="md:col-span-1">
          <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 sticky top-4">
            <h2 className="font-bold text-xl mb-4 text-emerald-900 flex items-center gap-2">
              Ingredientes
              <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                {recipe.recipe_ingredients.length}
              </span>
            </h2>
            <ul className="space-y-3">
              {recipe.recipe_ingredients.map((item: any, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-0.5 text-emerald-500 shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="font-bold">{item.amount}</span> de {item.ingredients.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Pasos */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="font-bold text-2xl mb-6 text-slate-800">Preparación</h2>
            <div className="space-y-6">
              {recipe.steps && Array.isArray(recipe.steps) ? (
                recipe.steps.map((step: string, index: number) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-slate-200 group-hover:bg-emerald-600 transition-colors">
                        {index + 1}
                      </div>
                      {index !== recipe.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-100 my-2" />
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed pt-1 pb-4 text-lg">
                      {step}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No hay pasos registrados.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}