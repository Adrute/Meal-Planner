import { createClient } from '@/lib/supabase/server'
import { Zap, Flame, Plus, FileText, BarChart3, Wrench } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UtilitiesDashboard() {
  const supabase = await createClient()

  // 1. Cargar las facturas reales de la base de datos
  const { data: invoices } = await supabase
    .from('home_invoices')
    .select('*')
    .order('created_at', { ascending: false })

  const hasData = invoices && invoices.length > 0;
  const latestInvoice = hasData ? invoices[0] : null;

  // 2. Calcular Medias Mensuales
  // Como tus facturas son bimensuales, dividimos el total entre 2 para saber el gasto/mes
  let avgElec = 0, avgGas = 0, avgServ = 0;
  if (hasData) {
    const totalElec = invoices.reduce((acc, inv) => acc + Number(inv.elec_amount || 0), 0);
    const totalGas = invoices.reduce((acc, inv) => acc + Number(inv.gas_amount || 0), 0);
    const totalServ = invoices.reduce((acc, inv) => acc + Number(inv.services_amount || 0), 0);
    
    avgElec = (totalElec / invoices.length) / 2;
    avgGas = (totalGas / invoices.length) / 2;
    avgServ = (totalServ / invoices.length) / 2;
  }

  // 3. Preparar datos para la Gráfica (Máximo últimas 6 facturas en orden cronológico)
  const chartData = hasData ? [...invoices].slice(0, 6).reverse() : [];
  const maxInvoiceAmount = hasData ? Math.max(...chartData.map(i => Number(i.total_amount))) : 100;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 animate-in fade-in">
      
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Suministros</h1>
          <p className="text-slate-500 font-medium mt-1">TotalEnergies • Luz, Gas y Facilita</p>
        </div>
        
        <Link href="/utilities/import" className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg">
          <Plus size={20} />
          Importar Facturas
        </Link>
      </header>

      {/* GRID DE ESTADO ACTUAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* LUZ */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-600"><Zap size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Electricidad</h2>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Última Factura</span>
                <span className="font-bold text-slate-800 text-sm">
                  {latestInvoice ? `${Number(latestInvoice.elec_amount).toFixed(2)} €` : '-- €'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Media</span>
             <span className="text-2xl font-black text-slate-900">
               {hasData ? `~ ${avgElec.toFixed(0)} €` : '-- €'}
               <span className="text-sm font-medium text-slate-400">/mes</span>
             </span>
          </div>
        </section>

        {/* GAS */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Flame size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Gas Natural</h2>
            </div>
             <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Última Factura</span>
                <span className="font-bold text-slate-800 text-sm">
                  {latestInvoice ? `${Number(latestInvoice.gas_amount).toFixed(2)} €` : '-- €'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Media</span>
             <span className="text-2xl font-black text-slate-900">
                {hasData ? `~ ${avgGas.toFixed(0)} €` : '-- €'}
               <span className="text-sm font-medium text-slate-400">/mes</span>
             </span>
          </div>
        </section>

        {/* SERVICIOS */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600"><Wrench size={20} /></div>
              <h2 className="font-bold text-lg text-slate-800">Facilita</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm text-slate-600 leading-relaxed">
              Servicio de mantenimiento, revisiones y urgencias.
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Media</span>
             <span className="text-2xl font-black text-slate-900">
               {hasData ? `~ ${avgServ.toFixed(2)} €` : '-- €'}
               <span className="text-sm font-medium text-slate-400">/mes</span>
             </span>
          </div>
        </section>
      </div>

      {/* ÁREA DE ANÁLISIS HISTÓRICO CON GRÁFICA REAL */}
      <section className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg text-emerald-400"><BarChart3 size={20} /></div>
            <h2 className="font-bold text-xl">Evolución del Gasto Total (Bimensual)</h2>
          </div>
          <span className="text-slate-400 text-sm">{invoices?.length || 0} recibos analizados</span>
        </div>
        
        {!hasData ? (
          <div className="h-64 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-800/50">
            <FileText size={48} className="mb-4 opacity-50 text-slate-500" />
            <p className="font-medium text-center px-4">Aún no hay facturas importadas.</p>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-2 md:gap-6 pt-10 border-b border-slate-700 pb-2 px-2">
            {chartData.map((inv, index) => {
              // Calculamos el porcentaje de altura respecto a la factura más cara
              const heightPercent = Math.max((Number(inv.total_amount) / maxInvoiceAmount) * 100, 5);
              
              return (
                <div key={inv.id || index} className="flex flex-col items-center justify-end h-full group flex-1">
                  {/* Etiqueta flotante con el importe */}
                  <div className="text-emerald-400 font-bold text-xs md:text-sm mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {Number(inv.total_amount).toFixed(2)} €
                  </div>
                  
                  {/* Barra de la gráfica */}
                  <div className="w-full relative flex justify-center items-end bg-slate-800 rounded-t-lg hover:bg-slate-700 transition-colors cursor-pointer overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-700 ease-out"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  
                  {/* Identificador de factura abajo */}
                  <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                    {inv.invoice_number.slice(-5)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}