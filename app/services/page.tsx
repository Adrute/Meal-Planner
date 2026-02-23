import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, AlertCircle, Plus, Trash2, CalendarHeart } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function ServicesDashboard() {
  const supabase = await createClient()

  // Fecha actual para ponerla por defecto en los selectores
  const today = new Date().toISOString().split('T')[0]

  const { data: services } = await supabase
    .from('service_passes')
    .select('*')
    .order('created_at', { ascending: true })

  async function addService(formData: FormData) {
    'use server'
    const service_name = formData.get('service_name') as string
    const total_sessions = Number(formData.get('total_sessions'))
    const amount_paid = Number(formData.get('amount_paid'))
    const payment_date = formData.get('payment_date') as string || new Date().toISOString().split('T')[0]
    
    const supabase = await createClient()
    
    if (service_name && total_sessions > 0) {
      await supabase.from('service_passes').insert([{
        service_name,
        total_sessions,
        used_sessions: 0,
        amount_paid,
        last_payment_date: payment_date,
        session_dates: [] // Iniciamos el historial de fechas vacío
      }])
      revalidatePath('/services')
      revalidatePath('/')
    }
  }

  async function deleteService(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = await createClient()
    await supabase.from('service_passes').delete().eq('id', id)
    revalidatePath('/services')
    revalidatePath('/')
  }

  async function consumeSession(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const consume_date = formData.get('consume_date') as string
    const supabase = await createClient()
    
    // 1. Obtenemos el bono actual para leer el historial de fechas
    const { data } = await supabase.from('service_passes').select('used_sessions, session_dates').eq('id', id).single()
    
    if (data) {
      // 2. Añadimos la nueva fecha al historial
      const currentDates = data.session_dates || []
      currentDates.push(consume_date)

      // 3. Guardamos en base de datos
      await supabase.from('service_passes').update({ 
        used_sessions: data.used_sessions + 1,
        session_dates: currentDates
      }).eq('id', id)
    }

    revalidatePath('/services')
    revalidatePath('/')
  }

  async function renewService(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const renewal_date = formData.get('renewal_date') as string
    const supabase = await createClient()
    
    await supabase.from('service_passes').update({ 
      used_sessions: 0, 
      last_payment_date: renewal_date,
      session_dates: [] // Al renovar, el historial de sesiones vuelve a cero
    }).eq('id', id)
    
    revalidatePath('/services')
    revalidatePath('/')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in pb-24 md:pb-12">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900">Servicios & Bonos</h1>
        <p className="text-slate-500 font-medium mt-1">Controla tus pagos recurrentes y las sesiones que te quedan.</p>
      </header>

      {/* FORMULARIO PARA AÑADIR BONO */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-10">
        <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <CalendarHeart size={20} className="text-emerald-500"/> Nuevo Bono
        </h2>
        <form action={addService} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre del servicio</label>
            <input type="text" name="service_name" required placeholder="Ej: Clases de inglés" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nº Sesiones</label>
            <input type="number" name="total_sessions" required min="1" placeholder="Ej: 10" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Precio (€)</label>
            <input type="number" step="0.01" name="amount_paid" required min="0" placeholder="Ej: 150" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Fecha Pago</label>
            <input type="date" name="payment_date" defaultValue={today} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-600" />
          </div>
          <div className="md:col-span-5 mt-2">
            <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
              Crear Bono
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE BONOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services?.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-3xl border border-slate-100">
            Aún no tienes ningún bono registrado.
          </div>
        )}

        {services?.map((service) => {
          const isExhausted = service.used_sessions >= service.total_sessions;
          const remaining = service.total_sessions - service.used_sessions;
          const progressPercent = (service.used_sessions / service.total_sessions) * 100;

          return (
            <div key={service.id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between group">
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-bold text-xl text-slate-800">{service.service_name}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Pagado: {new Date(service.last_payment_date).toLocaleDateString('es-ES')} ({Number(service.amount_paid).toFixed(2)}€)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isExhausted ? (
                      <div className="bg-red-50 text-red-600 p-2 rounded-xl"><AlertCircle size={24} /></div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl"><CheckCircle2 size={24} /></div>
                    )}
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={service.id} />
                      <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Eliminar bono">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">Consumidas: {service.used_sessions}</span>
                    <span className={isExhausted ? 'text-red-500' : 'text-emerald-500'}>
                      Quedan: {remaining}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isExhausted ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* HISTORIAL DE FECHAS CONSUMIDAS */}
                {service.session_dates && service.session_dates.length > 0 && (
                  <div className="mb-6 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Historial de sesiones</p>
                    <div className="flex flex-wrap gap-2">
                      {service.session_dates.map((date: string, i: number) => (
                        <span key={i} className="bg-slate-50 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200">
                          {new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* BOTONERAS DE ACCIÓN CON SELECTOR DE FECHA */}
              <div className="mt-auto">
                {isExhausted ? (
                  <form action={renewService} className="w-full flex gap-2">
                    <input type="hidden" name="id" value={service.id} />
                    <input type="date" name="renewal_date" defaultValue={today} required className="px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none text-slate-600 bg-slate-50" title="Fecha del nuevo pago" />
                    <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      Nuevo Pago
                    </button>
                  </form>
                ) : (
                  <form action={consumeSession} className="w-full flex gap-2">
                    <input type="hidden" name="id" value={service.id} />
                    <input type="date" name="consume_date" defaultValue={today} required className="px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none text-slate-600 bg-slate-50" title="Fecha de la sesión" />
                    <button type="submit" className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                      <Plus size={18} /> Consumir
                    </button>
                  </form>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}