import { Utensils, Wallet, Zap, ArrowRight, ShoppingBasket, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomeDashboard() {
  const supabase = await createClient()

  // Obtener datos reales de facturas para la tarjeta de Suministros
  const { data: invoices } = await supabase
    .from('home_invoices')
    .select('*')
    .order('issue_date', { ascending: false })

  const hasInvoices = invoices && invoices.length > 0;
  const latestInvoice = hasInvoices ? invoices[0] : null;

  // Cálculos de Medias Mensuales (Bimensual / 2)
  let avgElec = 0, avgGas = 0, avgServ = 0;
  if (hasInvoices) {
    avgElec = (invoices.reduce((acc, inv) => acc + Number(inv.elec_amount || 0), 0) / invoices.length) / 2;
    avgGas = (invoices.reduce((acc, inv) => acc + Number(inv.gas_amount || 0), 0) / invoices.length) / 2;
    avgServ = (invoices.reduce((acc, inv) => acc + Number(inv.services_amount || 0), 0) / invoices.length) / 2;
  }

  // --- ANÁLISIS AUTOMÁTICO DE MERCADO (Sin IA) ---
  let alert = null;
  if (latestInvoice && latestInvoice.elec_kwh > 0) {
    // Calculamos a cuánto estamos pagando la luz realmente (Euros / Consumo)
    const pricePerKwh = Number(latestInvoice.elec_amount) / Number(latestInvoice.elec_kwh);
    
    // Umbral estático del mercado regulado (ej: 0.16 €/kWh). 
    // En el futuro, este 0.16 puede venir de una API del gobierno en tiempo real.
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in">
      
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Hola, <span className="text-emerald-600">Familia</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Tu resumen del hogar actualizado a hoy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. MÓDULO DE COMIDAS (Diseño Limpio) */}
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

        {/* 2. MÓDULO DE FINANZAS */}
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

        {/* 3. MÓDULO DE SUMINISTROS (El que querías potente) */}
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
                {/* Desglose de Medias Mensuales */}
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

                {/* Banner de Análisis de Mercado */}
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
    </div>
  )
}