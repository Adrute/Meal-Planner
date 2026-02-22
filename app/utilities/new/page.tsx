import { Zap, Flame, FileText, Wrench, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { processMultipleInvoices } from '../actions'

export default function NewInvoicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 animate-in fade-in">
      
      <header className="mb-8 flex items-center gap-4">
        <Link href="/utilities" className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nueva Factura</h1>
          <p className="text-slate-500 font-medium">Introduce los datos del recibo conjunto.</p>
        </div>
      </header>

      <form action={processMultipleInvoices} className="space-y-6">
        
        {/* BLOQUE: DATOS GENERALES */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-100 pb-4">
            <FileText size={20} className="text-slate-400" />
            <h2 className="font-bold text-lg">Resumen General</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nº Factura</label>
              <input type="text" name="invoice_number" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="Ej: TF00112233" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Emisión</label>
              <input type="date" name="issue_date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Importe TOTAL (€)</label>
              <input type="number" step="0.01" name="total_amount" required className="w-full p-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* BLOQUE: LUZ */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-yellow-600 border-b border-slate-100 pb-4">
            <Zap size={20} />
            <h2 className="font-bold text-lg text-slate-800">Electricidad</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Desde</label>
              <input type="date" name="elec_start_date" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Hasta</label>
              <input type="date" name="elec_end_date" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Consumo (kWh)</label>
              <input type="number" step="1" name="elec_kwh" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Precio (€/kWh)</label>
              <input type="number" step="0.000001" name="elec_price_kwh" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" placeholder="0.1705" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Total Luz (€)</label>
              <input type="number" step="0.01" name="elec_amount" className="w-full p-3 rounded-xl border border-slate-200 bg-yellow-50/50 font-bold text-sm" placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* BLOQUE: GAS */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600 border-b border-slate-100 pb-4">
            <Flame size={20} />
            <h2 className="font-bold text-lg text-slate-800">Gas Natural</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Desde</label>
              <input type="date" name="gas_start_date" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Hasta</label>
              <input type="date" name="gas_end_date" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Consumo (kWh)</label>
              <input type="number" step="1" name="gas_kwh" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Precio (€/kWh)</label>
              <input type="number" step="0.000001" name="gas_price_kwh" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" placeholder="0.065" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-2">Total Gas (€)</label>
              <input type="number" step="0.01" name="gas_amount" className="w-full p-3 rounded-xl border border-slate-200 bg-blue-50/50 font-bold text-sm" placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* BLOQUE: SERVICIOS E IMPUESTOS */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <Wrench size={18} />
              <h3 className="font-bold text-slate-800">Servicio Facilita</h3>
            </div>
            <input type="number" step="0.01" name="services_amount" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="Ej: 24.79" />
          </div>
          <div>
             <div className="flex items-center gap-2 mb-4 text-slate-400">
              <FileText size={18} />
              <h3 className="font-bold text-slate-800">Impuestos Totales</h3>
            </div>
            <input type="number" step="0.01" name="taxes_amount" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="Suma de IVA e Imp. Eléctrico" />
          </div>
        </section>

        {/* BOTÓN GUARDAR */}
        <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex justify-center items-center gap-2 active:scale-95">
          <Save size={24} />
          Guardar Factura
        </button>

      </form>
    </div>
  )
}