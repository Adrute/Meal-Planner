import { Utensils, Wallet, Zap, ArrowRight, ShoppingBasket, AlertTriangle, CheckCircle2, CalendarHeart, Plus, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function HomeDashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. Cargar facturas
  const { data: invoices } = await supabase
    .from('home_invoices')
    .select('*')
    .order('issue_date', { ascending: false })

  const hasInvoices = invoices && invoices.length > 0;
  const latestInvoice = hasInvoices ? invoices[0] : null;

  let avgElec = 0, avgGas = 0, avgServ = 0;
  if (hasInvoices) {
    avgElec = (invoices.reduce((acc, inv) => acc + Number(inv.elec_amount || 0), 0) / invoices.length) / 2;
    avgGas = (invoices.reduce((acc, inv) => acc + Number(inv.gas_amount || 0), 0) / invoices.length) / 2;
    avgServ = (invoices.reduce((acc, inv) => acc + Number(inv.services_amount || 0), 0) / invoices.length) / 2;
  }

  // Análisis automático de Luz
  let alert = null;
  if (latestInvoice && latestInvoice.elec_kwh > 0) {
    const pricePerKwh = Number(latestInvoice.elec_amount) / Number(latestInvoice.elec_kwh);
    const MARKET_THRESHOLD = 0.16;

    if (pricePerKwh > MARKET_THRESHOLD) {
      alert = {
        type: 'warning',
        title: 'Revisa tu tarifa de Luz',
        message: `Estás pagando la luz a ${pricePerKwh.toFixed(3)} €/kWh. El mercado ronda los ${MARKET_THRESHOLD} €. Podrías estar pagando de más.`
      };
    } else {
      alert = {
        type: 'success',
        title: 'Tarifa Optimizada',
        message: `Pagas la luz a ${pricePerKwh.toFixed(3)} €/kWh. Estás por debajo del mercado regulado.`
      };
    }
  }

  // 2. Cargar Bonos
  const { data: services } = await supabase
    .from('service_passes')
    .select('*')
    .order('created_at', { ascending: true })

  // 3. Acciones de Bonos (Ejecutadas directamente desde el Dashboard)
  async function deleteService(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabaseServer = await createClient()
    await supabaseServer.from('service_passes').delete().eq('id', id)
    revalidatePath('/')
    revalidatePath('/services')
  }

  async function consumeSession(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const consume_date = formData.get('consume_date') as string
    const supabaseServer = await createClient()

    const { data } = await supabaseServer.from('service_passes').select('used_sessions, session_dates').eq('id', id).single()

    if (data) {
      const currentDates = data.session_dates || []
      currentDates.push(consume_date)

      await supabaseServer.from('service_passes').update({
        used_sessions: data.used_sessions + 1,
        session_dates: currentDates
      }).eq('id', id)
    }
    revalidatePath('/')
    revalidatePath('/services')
  }

  async function renewService(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const renewal_date = formData.get('renewal_date') as string
    const supabaseServer = await createClient()

    await supabaseServer.from('service_passes').update({
      used_sessions: 0,
      last_payment_date: renewal_date,
      session_dates: []
    }).eq('id', id)

    revalidatePath('/')
    revalidatePath('/services')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in">

      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Hola, <span className="text-emerald-600">Familia</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Tu resumen del hogar actualizado a hoy.</p>
      </header>

      {/* --- INICIO DE LA CUADRÍCULA SUPERIOR (3 COLUMNAS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* WIDGET 1: COMIDAS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600"><Utensils size={20} /></div>
                <h2 className="font-bold text-lg text-slate-800">Menú de Hoy</h2>
              </div>
              <Link href="/meals" className="text-slate-400 hover:text-orange-600 transition-colors">
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-l-2 border-orange-400 pl-4 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Almuerzo</span>
                <p className="font-semibold text-slate-800 text-sm">Arroz Thai</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cena</span>
                <p className="font-semibold text-slate-800 text-sm">Espagueti con salsa casera</p>
              </div>
            </div>
          </div>
          <Link href="/shopping-list" className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-200">
            <ShoppingBasket size={18} /> Compra
          </Link>
        </div>

        {/* WIDGET 2: FINANZAS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Wallet size={20} /></div>
                <h2 className="font-bold text-lg text-slate-800">Finanzas</h2>
              </div>
              <Link href="/finances" className="text-slate-400 hover:text-blue-600 transition-colors">
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="mb-6">
              <span className="text-sm font-medium text-slate-500">Gasto este mes</span>
              <div className="mt-1">
                <span className="text-4xl font-black text-slate-900">-- €</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <span className="text-sm text-slate-400 font-medium">Conecta tus movimientos CSV</span>
          </div>
        </div>

        {/* WIDGET 3: SUMINISTROS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Zap size={20} /></div>
                <h2 className="font-bold text-lg text-slate-800">Suministros</h2>
              </div>
              <Link href="/utilities" className="text-slate-400 hover:text-emerald-600 transition-colors">
                <ArrowRight size={20} />
              </Link>
            </div>

            {hasInvoices ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Luz/mes</span>
                    <span className="font-black text-slate-800 text-lg">{avgElec.toFixed(0)}€</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gas/mes</span>
                    <span className="font-black text-slate-800 text-lg">{avgGas.toFixed(0)}€</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Serv/mes</span>
                    <span className="font-black text-slate-800 text-lg">{avgServ.toFixed(0)}€</span>
                  </div>
                </div>

                {alert && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${alert.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <div className="mt-0.5">
                      {alert.type === 'warning' ? <AlertTriangle size={18} className="text-orange-500" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-0.5">{alert.title}</p>
                      <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center h-full flex flex-col justify-center">
                <span className="text-sm text-slate-400 font-medium block mb-2">Sin datos analizados</span>
                <Link href="/utilities/import" className="text-emerald-600 text-xs font-bold hover:underline">Importar primera factura &rarr;</Link>
              </div>
            )}
          </div>
        </div>

      </div>
      {/* --- FIN DE LA CUADRÍCULA SUPERIOR --- */}


      {/* --- INICIO DEL MÓDULO DE BONOS (VISTA DETALLADA) --- */}
      {services && services.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600"><CalendarHeart size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Estado de los Bonos</h2>
            </div>
            <Link href="/services" className="text-slate-400 hover:text-purple-600 transition-colors flex items-center gap-1 text-sm font-bold">
              Configurar <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const isExhausted = service.used_sessions >= service.total_sessions;
              const remaining = service.total_sessions - service.used_sessions;
              const progressPercent = (service.used_sessions / service.total_sessions) * 100;

              return (
                <div key={service.id} className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 flex flex-col justify-between group relative overflow-hidden">

                  {isExhausted && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest text-center py-0.5 shadow-sm">
                      Renovación
                    </div>
                  )}

                  <div className={isExhausted ? 'mt-3' : ''}>
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

                    {/* Barra de progreso de sesiones consumidas */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-slate-700">Consumidas: {service.used_sessions}</span>
                        <span className={isExhausted ? 'text-red-500' : 'text-emerald-500'}>
                          Quedan: {remaining}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isExhausted ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* HISTORIAL DE FECHAS CONSUMIDAS */}
                    {service.session_dates && service.session_dates.length > 0 && (
                      <div className="mb-6 pt-4 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Historial de sesiones</p>
                        <div className="flex flex-wrap gap-2">
                          {service.session_dates.map((date: string, i: number) => (
                            <span key={i} className="bg-white text-slate-500 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200">
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
                        <input type="date" name="renewal_date" defaultValue={today} required className="px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none text-slate-600 bg-white" title="Fecha del nuevo pago" />
                        <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                          Nuevo Pago
                        </button>
                      </form>
                    ) : (
                      <form action={consumeSession} className="w-full flex gap-2">
                        <input type="hidden" name="id" value={service.id} />
                        <input type="date" name="consume_date" defaultValue={today} required className="px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none text-slate-600 bg-white" title="Fecha de la sesión" />
                        <button type="submit" className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-sm">
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
      )}
      {/* --- FIN DEL MÓDULO DE BONOS --- */}

    </div>
  )
}