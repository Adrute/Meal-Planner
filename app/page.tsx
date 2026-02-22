import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UtensilsCrossed, Wallet, Zap, ArrowRight, TrendingDown, Clock, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()

  // 1. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.username || "Familia"

  // 2. Obtener comidas de HOY (Mantenemos la funcionalidad que ya existe)
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayMeals } = await supabase
    .from('weekly_plan')
    .select('id, meal_type, recipes(name)')
    .eq('day_date', todayStr)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Hola, <span className="text-emerald-600">{userName}</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">Este es el resumen de tu hogar hoy.</p>
      </header>

      {/* BENTO GRID (Panel de control) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 1: COMIDAS (Ocupa 1 columna) */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600"><UtensilsCrossed size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Menú de Hoy</h2>
            </div>
            <Link href="/planner" className="text-slate-400 hover:text-emerald-600 transition-colors">
              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {!todayMeals || todayMeals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 text-sm font-medium mb-3">No hay comidas planificadas.</p>
                <Link href="/planner" className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-bold text-xs shadow-sm border border-slate-200 hover:border-emerald-200 transition-all">
                  Planificar ahora
                </Link>
              </div>
            ) : (
              todayMeals.map((meal: any) => (
                <div key={meal.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                    {meal.meal_type}
                  </span>
                  <p className="font-bold text-slate-800 line-clamp-2">
                    {meal.recipes?.name || "Receta sin nombre"}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <Link href="/shopping-list" className="mt-4 w-full bg-slate-900 text-white text-center py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
            Ver Lista de Compra
          </Link>
        </section>

        {/* WIDGET 2: FINANZAS (Placeholder Activo) */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Wallet size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Finanzas</h2>
            </div>
            <Link href="/finances" className="text-slate-400 hover:text-emerald-600 transition-colors">
              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-slate-400 text-sm font-medium mb-1">Gasto este mes</p>
            <h3 className="text-4xl font-black text-slate-900 flex items-center gap-2">
              -- € <TrendingDown size={24} className="text-emerald-500" />
            </h3>
            
            <div className="mt-6 space-y-2">
               <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                 <span className="text-slate-500 font-medium">Últimos movimientos</span>
                 <span className="text-slate-300 text-xs">Sin datos</span>
               </div>
            </div>
          </div>

          {/* Overlay "En construcción" que se quita al hacer clic en el módulo futuro */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Link href="/finances" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
              <Plus size={18} /> Configurar Módulo
            </Link>
          </div>
        </section>

        {/* WIDGET 3: SUMINISTROS / HOGAR (Placeholder Activo) */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 shadow-xl text-white flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Zap size={100} />
          </div>

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl text-yellow-400 backdrop-blur-sm"><Zap size={20} /></div>
              <h2 className="font-bold text-lg">Hogar & Luz</h2>
            </div>
            <Link href="/utilities" className="text-slate-400 hover:text-white transition-colors">
              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-end">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-widest mb-2">
                <Clock size={14} /> Próxima Factura
              </div>
              <p className="text-slate-400 text-sm">Configura tu comercializadora para ver la estimación de gasto en tiempo real.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}