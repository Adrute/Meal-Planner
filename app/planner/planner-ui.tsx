'use client'

import { useState, useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, isBefore, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { assignMeal, removeMeal, deleteWeekPlan } from './actions'
import { Plus, X, ChefHat, CalendarPlus, Utensils, Moon, Search, Trash2, CheckCircle2 } from 'lucide-react'

// --- Tipos ---
type Recipe = { id: string; name: string }
type PlanItem = { 
  day_date: string; 
  meal_type: string; 
  recipe_id: string; 
  recipes?: { name: string } | null 
}

export default function PlannerContainer({ 
  recipes, 
  initialPlan 
}: { 
  recipes: Recipe[], 
  initialPlan: PlanItem[]
}) {
  const [visibleWeeks, setVisibleWeeks] = useState<Date[]>([startOfWeek(new Date(), { weekStartsOn: 1 })])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, type: 'Almuerzo' | 'Cena'} | null>(null)
  
  // Nuevo estado para la fecha seleccionada en el modal (antes de confirmar)
  const [tempSelectedDate, setTempSelectedDate] = useState<string>('')

  useMemo(() => {
    if (initialPlan.length > 0) {
      const planWeeks = initialPlan.map(p => startOfWeek(parseISO(p.day_date), { weekStartsOn: 1 }))
      setVisibleWeeks(prev => {
        const combined = [...prev, ...planWeeks]
        const unique = Array.from(new Set(combined.map(d => d.getTime()))).map(t => new Date(t))
        return unique.sort((a, b) => a.getTime() - b.getTime())
      })
    }
  }, [initialPlan])

  // Lógica para confirmar la adición de la semana
  const handleConfirmAddWeek = () => {
    if (!tempSelectedDate) return

    const date = parseISO(tempSelectedDate)
    const newWeekStart = startOfWeek(date, { weekStartsOn: 1 })
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    if (isBefore(newWeekStart, currentWeekStart)) {
      alert("Para ver el historial pasado, usa el panel de administración.")
      return
    }

    setVisibleWeeks(prev => {
      if (prev.some(w => isSameDay(w, newWeekStart))) return prev
      return [...prev, newWeekStart].sort((a, b) => a.getTime() - b.getTime())
    })
    
    // Limpiamos y cerramos
    setTempSelectedDate('')
    setIsModalOpen(false)
  }

  const handleRemoveWeek = async (weekStart: Date) => {
    const startStr = format(weekStart, 'yyyy-MM-dd')
    const endStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    if(confirm(`⚠️ ¿Estás seguro de borrar TODOS los planes de la semana del ${format(weekStart, 'd MMM')}? Esta acción borrará los datos de la base de datos.`)) {
      const res = await deleteWeekPlan(startStr, endStr)
      if (res.success) {
        setVisibleWeeks(prev => prev.filter(w => !isSameDay(w, weekStart)))
      } else {
        alert("Hubo un error al intentar borrar la semana.")
      }
    }
  }

  const handleDeleteMeal = async (date: Date, type: string) => {
    if(confirm('¿Borrar este plato?')) {
      await removeMeal(format(date, 'yyyy-MM-dd'), type)
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Planificador</h1>
          <p className="text-slate-500 font-medium">Gestiona tus menús semanales</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-95 group"
        >
          <div className="bg-slate-700 rounded-lg p-1 group-hover:bg-slate-600 transition-colors">
            <CalendarPlus size={18} />
          </div>
          <span>Añadir Semana</span>
        </button>
      </div>

      {visibleWeeks.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">No hay semanas visibles.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold mt-2 hover:underline">Añadir una semana</button>
        </div>
      )}

      {visibleWeeks.map(weekStart => (
        <WeekBlock 
          key={weekStart.toISOString()} 
          startOfWeekDate={weekStart}
          plan={initialPlan}
          onSlotClick={setSelectedSlot}
          onDeleteMeal={handleDeleteMeal}
          onRemoveWeek={() => handleRemoveWeek(weekStart)}
        />
      ))}

      {/* --- MODAL AÑADIR SEMANA (CORREGIDO) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          {/* Backdrop click para cerrar opcional */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm relative overflow-hidden z-10">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            
            <div className="mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <CalendarPlus size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Añadir Semana</h3>
              <p className="text-sm text-slate-500 mt-2">Selecciona un día y confirma.</p>
            </div>

            {/* INPUT: Solo actualiza el estado temporal */}
            <input 
              type="date" 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl mb-4 font-bold text-slate-700 focus:border-emerald-500 focus:ring-0 outline-none transition-colors cursor-pointer"
              onChange={(e) => setTempSelectedDate(e.target.value)}
              value={tempSelectedDate}
            />
            
            {/* BOTÓN CONFIRMAR: Realiza la acción */}
            <button 
              onClick={handleConfirmAddWeek}
              disabled={!tempSelectedDate}
              className="w-full py-3 mb-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <CheckCircle2 size={18} />
              Añadir al panel
            </button>

            <button onClick={() => setIsModalOpen(false)} className="w-full py-3 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL SELECCIÓN RECETA --- */}
      {selectedSlot && (
        <RecipeSelectorModal 
          recipes={recipes} 
          slot={selectedSlot} 
          onClose={() => setSelectedSlot(null)}
          onSelect={async (recipeId: string) => {
             await assignMeal(format(selectedSlot.date, 'yyyy-MM-dd'), selectedSlot.type, recipeId)
             setSelectedSlot(null)
          }}
        />
      )}
    </div>
  )
}

// === COMPONENTE: BLOQUE DE SEMANA ===
function WeekBlock({ startOfWeekDate, plan, onSlotClick, onDeleteMeal, onRemoveWeek }: any) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfWeekDate, i))
  const endDate = endOfWeek(startOfWeekDate, { weekStartsOn: 1 })
  const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), startOfWeekDate)

  return (
    <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
      
      {/* Cabecera Semana */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isCurrentWeek ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            {isCurrentWeek ? 'Semana Actual' : `S${format(startOfWeekDate, 'w')}`}
          </span>
          <h2 className="font-bold text-xl md:text-2xl text-slate-800 capitalize tracking-tight">
            {format(startOfWeekDate, "d MMMM", { locale: es })} - {format(endDate, "d MMMM", { locale: es })}
          </h2>
        </div>

        <button 
          onClick={onRemoveWeek}
          className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl border border-transparent hover:border-red-100 transition-all self-start md:self-auto group"
        >
          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          <span>Borrar semana</span>
        </button>
      </div>

      {/* GRID DE DÍAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 auto-rows-fr">
        {days.map(day => {
          const isToday = isSameDay(day, new Date())
          const dateStr = format(day, 'yyyy-MM-dd')

          return (
            <div 
              key={day.toString()} 
              className={`rounded-2xl p-4 flex flex-col transition-all border relative
                ${isToday 
                  ? 'bg-slate-50/50 border-emerald-200 ring-2 ring-emerald-100 ring-offset-2' 
                  : 'bg-white border-slate-100'
                }`}
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                <span className={`text-sm font-bold capitalize ${isToday ? 'text-emerald-700' : 'text-slate-600'}`}>
                   {format(day, 'EEEE', { locale: es })}
                </span>
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-400 bg-slate-50'}`}>
                   {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                {(['Almuerzo', 'Cena'] as const).map((type) => {
                  const item = plan.find((p: any) => 
                    p.day_date === dateStr && p.meal_type.toLowerCase() === type.toLowerCase()
                  )
                  const isLunch = type === 'Almuerzo'

                  return (
                    <div key={type} className="flex-1">
                      {item ? (
                        <div className={`p-3 rounded-xl h-full flex flex-col justify-between border shadow-sm transition-all
                          ${isLunch 
                            ? 'bg-orange-100/50 border-orange-200 hover:border-orange-300' 
                            : 'bg-indigo-100/50 border-indigo-200 hover:border-indigo-300'
                          }`}>
                          
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-1.5">
                                {isLunch ? <Utensils size={12} className="text-orange-600"/> : <Moon size={12} className="text-indigo-600"/>}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLunch ? 'text-orange-700' : 'text-indigo-700'}`}>
                                  {type}
                                </span>
                             </div>
                             
                             <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteMeal(day, type); }}
                                className="text-slate-400 hover:text-red-500 hover:bg-white p-1 rounded-md transition-colors"
                                title="Borrar"
                              >
                                <X size={16} />
                              </button>
                          </div>
                          
                          <Link href={`/recipes/${item.recipe_id}`} className="block">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight hover:underline decoration-slate-400 underline-offset-2">
                              {item.recipes?.name || 'Receta sin nombre'}
                            </h4>
                          </Link>
                        </div>
                      ) : (
                        <button 
                          onClick={() => onSlotClick({ date: day, type })}
                          className="w-full min-h-[50px] md:min-h-[60px] h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all group/btn"
                        >
                          <Plus size={14} className="group-hover/btn:scale-110 transition-transform"/>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// === MODAL BUSCADOR ===
function RecipeSelectorModal({ recipes, slot, onClose, onSelect }: any) {
   const [search, setSearch] = useState('')
   const filtered = recipes.filter((r: Recipe) => r.name.toLowerCase().includes(search.toLowerCase()))

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in">
         <div className="absolute inset-0" onClick={onClose} />
         <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Elegir Receta</h3>
                    <p className="text-xs text-slate-500 capitalize font-medium">{slot.type} • {format(slot.date, 'EEEE d', { locale: es })}</p>
                  </div>
                  <button onClick={onClose} className="p-2 bg-white hover:bg-slate-200 rounded-full shadow-sm border border-slate-100"><X size={18}/></button>
               </div>
               
               <div className="relative">
                 <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                 <input 
                    autoFocus
                    placeholder="Buscar plato..." 
                    className="w-full pl-10 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                    onChange={e => setSearch(e.target.value)}
                 />
               </div>
            </div>

            <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
               {filtered.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2">
                   <Utensils size={32} className="opacity-20"/>
                   No encontrada
                 </div>
               ) : (
                 filtered.map((r: Recipe) => (
                    <button key={r.id} onClick={() => onSelect(r.id)} className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl flex items-center gap-3 group transition-colors border border-transparent hover:border-emerald-100">
                       <div className="bg-slate-100 text-slate-400 p-2.5 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                         <ChefHat size={18}/>
                       </div>
                       <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-900">{r.name}</span>
                    </button>
                 ))
               )}
            </div>
         </div>
      </div>
   )
}