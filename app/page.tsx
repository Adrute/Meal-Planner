import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Utensils, ChefHat, ArrowRight, CalendarDays, ShoppingCart, Moon, Sun, Plus, Search } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.username || "Chef"

  // Obtener comidas de HOY
  const { data: todayMeals } = await supabase
    .from('weekly_plan')
    .select(`
      id, meal_type, recipe_id,
      recipes (name, id)
    `)
    .eq('day_date', todayStr)

  // Calcular totales (simulado para visual)
  const mealsCount = todayMeals?.length || 0

  return (
    // CAMBIO 1: Contenedor centrado con márgenes y ancho máximo
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      
      {/* HEADER: Saludo y Fecha */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {format(today, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Hola, <span className="text-emerald-600">{userName}</span>
            <br className="md:hidden" /> ¿Cocinamos?
          </h1>
        </div>
        
        {/* Botón rápido móvil/pc */}
        <Link href="/planner" className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
          Ir al planificador <ArrowRight size={16} />
        </Link>
      </header>

      {/* GRID PRINCIPAL: 2 Columnas en PC, 1 en Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (2/3): MENÚ DE HOY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Utensils size={18} /></div>
              Menú de Hoy
            </h2>
            {mealsCount > 0 && (
               <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{mealsCount} platos</span>
            )}
          </div>

          {!todayMeals || todayMeals.length === 0 ? (
            // ESTADO VACÍO MEJORADO
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-8 md:p-12 text-center flex flex-col items-center justify-center group hover:border-emerald-200 transition-colors">
              <div className="bg-slate-50 p-5 rounded-full text-slate-300 mb-4 group-hover:scale-110 transition-transform duration-300">
                <ChefHat size={40} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Tu cocina está tranquila hoy</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                No hay nada planificado. Es un buen momento para improvisar o planificar la semana.
              </p>
              <Link 
                href="/planner" 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all active:scale-95"
              >
                Planificar Ahora
              </Link>
            </div>
          ) : (
            // LISTA DE COMIDAS
            <div className="grid grid-cols-1 gap-4">
              {todayMeals
                .sort((a, b) => a.meal_type === 'Almuerzo' ? -1 : 1)
                .map((meal: any) => (
                <MealCard 
                  key={meal.id}
                  type={meal.meal_type}
                  title={meal.recipes?.name}
                  recipeId={meal.recipes?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (1/3): ACCESOS RÁPIDOS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><CalendarDays size={18} /></div>
            Accesos Rápidos
          </h2>

          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
            <QuickAction 
              href="/shopping-list"
              title="Lista de Compra" 
              icon={<ShoppingCart size={20}/>}
              color="bg-blue-50 text-blue-600"
            />
            <QuickAction 
              href="/recipes/new"
              title="Crear Receta" 
              icon={<Plus size={20}/>} 
              color="bg-emerald-50 text-emerald-600"
            />
             <QuickAction 
              href="/recipes"
              title="Buscar Plato" 
              icon={<Search size={20}/>} 
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Widget Decorativo (Resumen Semanal - Estático por ahora) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ChefHat size={120} />
            </div>
            <h3 className="font-bold text-lg mb-1 relative z-10">Organiza tu semana</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10">Tómate 5 minutos para planificar y ahorra tiempo comprando.</p>
            <Link href="/planner" className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold transition-colors relative z-10">
              Ir al Calendario
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function MealCard({ type, title, recipeId }: any) {
  // Comprobación robusta (ignora mayúsculas/minúsculas)
  const isLunch = type.toLowerCase() === 'almuerzo';
  
  return (
    <Link href={`/recipes/${recipeId}`} className="group block h-full">
      <div className={`
        relative p-6 rounded-[2rem] border transition-all duration-300 h-full flex flex-col justify-between
        hover:shadow-lg hover:-translate-y-1
        ${isLunch 
          ? 'bg-gradient-to-br from-orange-100/80 to-white border-orange-200 hover:border-orange-300' 
          : 'bg-gradient-to-br from-indigo-100/80 to-white border-indigo-200 hover:border-indigo-300'
        }
      `}>
        {/* Etiqueta Tipo */}
        <div className="flex justify-between items-start mb-4">
          <span className={`
            text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm
            ${isLunch ? 'bg-white text-orange-700' : 'bg-white text-indigo-700'}
          `}>
            {isLunch ? <Sun size={12} /> : <Moon size={12} />}
            {type}
          </span>
          <div className="bg-white/80 p-2 rounded-full shadow-sm text-slate-300 group-hover:text-emerald-500 transition-colors backdrop-blur-sm">
            <ArrowRight size={16} />
          </div>
        </div>
        
        {/* Título y Pie */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
            {title || "Receta desconocida"}
          </h3>
          <p className="text-sm text-slate-500 font-medium">Ver detalles e ingredientes</p>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ title, icon, color, href }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-700">{title}</h4>
      </div>
      <div className="text-slate-300 group-hover:translate-x-1 transition-transform">
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}