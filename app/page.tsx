import { Utensils, Wallet, Zap, ArrowRight, ShoppingBasket, AlertTriangle, CheckCircle2, CalendarHeart, Plus, Trash2, AlertCircle, TrendingDown, GraduationCap, Moon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import SubmitButton from '@/components/SubmitButton'
import UpcomingReservationsWidget from '@/components/UpcomingReservationsWidget'
import { sendBonoAgotadoEmail } from '@/lib/email'

async function FinancesWidget() {
  const supabase = await createClient()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const { data: thisMonth } = await supabase
    .from('bank_transactions')
    .select('importe, categoria')
    .gte('fecha_operacion', `${currentMonth}-01`)

  const { data: prevMonthTx } = await supabase
    .from('bank_transactions')
    .select('importe, categoria')
    .gte('fecha_operacion', `${prevMonth}-01`)
    .lt('fecha_operacion', `${currentMonth}-01`)

  const gastosMes = Math.abs((thisMonth || []).filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
  const ingresosMes = (thisMonth || []).filter(t => t.importe > 0).reduce((s, t) => s + Number(t.importe), 0)
  const gastosPrev = Math.abs((prevMonthTx || []).filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
  const diff = gastosPrev > 0 ? ((gastosMes - gastosPrev) / gastosPrev) * 100 : 0

  // Top 3 categorías del mes anterior
  const catMap: Record<string, number> = {}
  for (const t of (prevMonthTx || []).filter(t => t.importe < 0)) {
    catMap[t.categoria] = (catMap[t.categoria] || 0) + Math.abs(Number(t.importe))
  }
  const top3Cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const hasData = (thisMonth || []).length > 0 || (prevMonthTx || []).length > 0

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
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

        {hasData ? (
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-sm font-medium text-slate-500">Gasto este mes</span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-4xl font-black text-slate-900">{gastosMes.toFixed(0)} €</span>
              </div>
              {gastosPrev > 0 && (
                <p className={`text-xs font-bold mt-1 ${diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs mes anterior
                </p>
              )}
            </div>
            {top3Cats.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Top categorías · mes anterior</p>
                <div className="space-y-2">
                  {top3Cats.map(([cat, amount], i) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-300 w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-700 flex-1 truncate">{cat}</span>
                      <span className="text-sm font-black text-slate-800 shrink-0">{amount.toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <span className="text-sm font-medium text-slate-500">Gasto este mes</span>
            <div className="mt-1">
              <span className="text-4xl font-black text-slate-900">-- €</span>
            </div>
          </div>
        )}
      </div>

      {hasData ? (
        <Link href="/finances" className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200">
          <TrendingDown size={18} /> Ver movimientos
        </Link>
      ) : (
        <Link href="/finances" className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200">
          Conectar movimientos →
        </Link>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function HomeDashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 0. Menú de hoy
  const { data: todayMeals } = await supabase
    .from('weekly_plan')
    .select('meal_type, recipes(name)')
    .eq('day_date', today)

  const { data: todaySchoolMenu } = await supabase
    .from('school_menu_items')
    .select('first_course, second_course, dessert')
    .eq('date', today)
    .maybeSingle()

  const todayAlmuerzo = todayMeals?.find(m => m.meal_type.toLowerCase() === 'almuerzo')
  const todayCena = todayMeals?.find(m => m.meal_type.toLowerCase() === 'cena')

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

    const { data } = await supabaseServer
      .from('service_passes')
      .select('used_sessions, total_sessions, session_dates, service_name, amount_paid')
      .eq('id', id)
      .single()

    if (data) {
      const currentDates = data.session_dates || []
      currentDates.push(consume_date)
      const newUsed = data.used_sessions + 1

      await supabaseServer.from('service_passes').update({
        used_sessions: newUsed,
        session_dates: currentDates,
      }).eq('id', id)

      if (newUsed >= data.total_sessions) {
        await sendBonoAgotadoEmail(data.service_name, data.total_sessions, data.amount_paid)
      }
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in">

      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Hola, <span className="text-emerald-600">Familia</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Tu resumen del hogar actualizado a hoy.</p>
      </header>

      {/* --- INICIO DE LA CUADRÍCULA SUPERIOR (AHORA 4 COLUMNAS EN LG, 2 EN MD) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* WIDGET 1: COMIDAS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600"><Utensils size={20} /></div>
                <div>
                  <h2 className="font-bold text-lg text-slate-800">Menú de Hoy</h2>
                  <p className="text-xs text-slate-400 font-medium capitalize">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <Link href="/meals" className="text-slate-400 hover:text-orange-600 transition-colors">
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="space-y-3 mb-6">
              {todaySchoolMenu && (
                <div className="border-l-2 border-emerald-400 pl-4 py-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <GraduationCap size={11} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Cole</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{todaySchoolMenu.first_course}</p>
                  {todaySchoolMenu.second_course && (
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">{todaySchoolMenu.second_course}</p>
                  )}
                  {todaySchoolMenu.dessert && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{todaySchoolMenu.dessert}</p>
                  )}
                </div>
              )}
              <div className="border-l-2 border-orange-400 pl-4 py-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Utensils size={11} className="text-orange-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Almuerzo</span>
                </div>
                {todayAlmuerzo ? (
                  <p className="font-semibold text-slate-800 text-sm leading-tight">
                    {(todayAlmuerzo.recipes as unknown as { name: string } | null)?.name ?? 'Sin nombre'}
                  </p>
                ) : (
                  <p className="text-sm text-slate-300 italic">Sin planificar</p>
                )}
              </div>
              <div className="border-l-2 border-indigo-300 pl-4 py-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Moon size={11} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cena</span>
                </div>
                {todayCena ? (
                  <p className="font-semibold text-slate-800 text-sm leading-tight">
                    {(todayCena.recipes as unknown as { name: string } | null)?.name ?? 'Sin nombre'}
                  </p>
                ) : (
                  <p className="text-sm text-slate-300 italic">Sin planificar</p>
                )}
              </div>
            </div>
          </div>
          <Link href="/shopping-list" className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-200">
            <ShoppingBasket size={18} /> Compra
          </Link>
        </div>

        {/* WIDGET 2: FINANZAS */}
        <FinancesWidget />

        {/* WIDGET 3: SUMINISTROS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
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

        {/* WIDGET 4: RESERVAS DE RESTAURANTES */}
        <UpcomingReservationsWidget />

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
                          <SubmitButton iconOnly className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Eliminar bono">
                            <Trash2 size={18} />
                          </SubmitButton>
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
                        <SubmitButton className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800" loadingText="Renovando...">
                          Nuevo Pago
                        </SubmitButton>
                      </form>
                    ) : (
                      <form action={consumeSession} className="w-full flex gap-2">
                        <input type="hidden" name="id" value={service.id} />
                        <input type="date" name="consume_date" defaultValue={today} required className="px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none text-slate-600 bg-white" title="Fecha de la sesión" />
                        <SubmitButton className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 shadow-sm" loadingText="Consumiendo...">
                          <Plus size={18} /> Consumir
                        </SubmitButton>
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