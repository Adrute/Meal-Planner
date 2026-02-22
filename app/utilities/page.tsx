import { createClient } from '@/lib/supabase/server'
import { Zap, Flame, Plus, FileText, BarChart3, Wrench, TableProperties, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ExportCsvButton from './export-csv'
import UtilitiesLineChart from './line-chart'

export const dynamic = 'force-dynamic'

export default async function UtilitiesDashboard() {
    const supabase = await createClient()

    // 1. Cargar facturas ordenadas por fecha
    const { data: invoices } = await supabase
        .from('home_invoices')
        .select('*')
        .order('issue_date', { ascending: false })

    const hasData = invoices && invoices.length > 0;
    const latestInvoice = hasData ? invoices[0] : null;
    const prevInvoice = hasData && invoices.length > 1 ? invoices[1] : null;

    // 2. Calcular Medias Mensuales
    let avgElec = 0, avgGas = 0, avgServ = 0;
    if (hasData) {
        const totalElec = invoices.reduce((acc, inv) => acc + Number(inv.elec_amount || 0), 0);
        const totalGas = invoices.reduce((acc, inv) => acc + Number(inv.gas_amount || 0), 0);
        const totalServ = invoices.reduce((acc, inv) => acc + Number(inv.services_amount || 0), 0);

        avgElec = (totalElec / invoices.length) / 2;
        avgGas = (totalGas / invoices.length) / 2;
        avgServ = (totalServ / invoices.length) / 2;
    }

    // 3. Tendencias (Comparar última factura con la anterior)
    const getTrend = (current: number, previous: number) => {
        if (!previous) return null;
        const diff = current - previous;
        return {
            value: Math.abs(diff).toFixed(2),
            isUp: diff > 0
        };
    };

    const trendElec = latestInvoice && prevInvoice ? getTrend(Number(latestInvoice.elec_amount), Number(prevInvoice.elec_amount)) : null;
    const trendGas = latestInvoice && prevInvoice ? getTrend(Number(latestInvoice.gas_amount), Number(prevInvoice.gas_amount)) : null;

    // 4. Preparar datos para la Gráfica Principal
    const chartData = hasData ? [...invoices].slice(0, 6).reverse() : [];
    const maxInvoiceAmount = hasData ? Math.max(...chartData.map(i => Number(i.total_amount))) : 100;

    // --- NUEVO: Preparar datos para el Gráfico de Líneas ---
    const maxValService = hasData ? Math.max(
        ...chartData.flatMap(i => [Number(i.elec_amount), Number(i.gas_amount), Number(i.services_amount), Number(i.taxes_amount)])
    ) : 100;

    // Funciones para calcular coordenadas (X: Meses, Y: Importe)
    const getX = (index: number) => chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
    const getY = (val: number | string) => 100 - (Number(val) / (maxValService || 1)) * 100;

    const getPoints = (key: 'elec_amount' | 'gas_amount' | 'services_amount' | 'taxes_amount') => {
        return chartData.map((inv, i) => `${getX(i)},${getY(inv[key])}`).join(' ');
    };

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

            {/* --- TARJETAS DE RESUMEN --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* LUZ */}
                <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-600"><Zap size={20} /></div>
                                <h2 className="font-bold text-lg text-slate-800">Electricidad</h2>
                            </div>
                            {trendElec && (
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendElec.isUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {trendElec.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {trendElec.value} €
                                </div>
                            )}
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
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Flame size={20} /></div>
                                <h2 className="font-bold text-lg text-slate-800">Gas Natural</h2>
                            </div>
                            {trendGas && (
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendGas.isUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {trendGas.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {trendGas.value} €
                                </div>
                            )}
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

            {/* --- GRÁFICA DE LÍNEAS (RECHARTS) --- */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><BarChart3 size={20} /></div>
                    <h2 className="font-bold text-xl text-slate-800">Evolución por Servicio</h2>
                </div>

                {!hasData ? (
                    <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 mt-6">
                        <FileText size={48} className="mb-4 opacity-50 text-slate-400" />
                        <p className="font-medium text-center px-4">Aún no hay facturas importadas.</p>
                    </div>
                ) : (
                    <UtilitiesLineChart data={chartData} />
                )}
            </section>

            {/* --- MODO TABLA E HISTÓRICO --- */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><TableProperties size={20} /></div>
                        <h2 className="font-bold text-xl text-slate-800">Histórico de Facturas</h2>
                    </div>

                    {hasData && <ExportCsvButton invoices={invoices} />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-4 py-4 rounded-tl-xl">Fecha Emisión</th>
                                <th className="px-4 py-4">Luz</th>
                                <th className="px-4 py-4">Gas</th>
                                <th className="px-4 py-4">Facilita</th>
                                <th className="px-4 py-4">Impuestos</th>
                                <th className="px-4 py-4 rounded-tr-xl text-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasData ? (
                                invoices.map((inv: any) => (
                                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-slate-900">
                                            {new Date(inv.issue_date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-4 py-4 text-yellow-600 font-medium">{Number(inv.elec_amount).toFixed(2)} €</td>
                                        <td className="px-4 py-4 text-blue-600 font-medium">{Number(inv.gas_amount).toFixed(2)} €</td>
                                        <td className="px-4 py-4 text-emerald-600 font-medium">{Number(inv.services_amount).toFixed(2)} €</td>
                                        <td className="px-4 py-4 text-slate-400">{Number(inv.taxes_amount).toFixed(2)} €</td>
                                        <td className="px-4 py-4 font-black text-slate-900 text-right">{Number(inv.total_amount).toFixed(2)} €</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin datos registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    )
}