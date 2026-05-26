import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import UtilitiesClient from './UtilitiesClient'

export const dynamic = 'force-dynamic'

export default async function UtilitiesDashboard() {
    const supabase = await createClient()

    const { data: invoices } = await supabase
        .from('home_invoices')
        .select('*')
        .order('issue_date', { ascending: false })

    const hasData = invoices && invoices.length > 0
    const latestInvoice = hasData ? invoices[0] : null
    const prevInvoice = hasData && invoices.length > 1 ? invoices[1] : null

    let avgElec = 0, avgGas = 0, avgServ = 0
    if (hasData) {
        const totalMonths = invoices.reduce((s, inv) => s + (inv.billing_period_months ?? 2), 0)
        if (totalMonths > 0) {
            avgElec = invoices.reduce((s, inv) => s + Number(inv.elec_amount || 0), 0) / totalMonths
            avgGas  = invoices.reduce((s, inv) => s + Number(inv.gas_amount || 0), 0) / totalMonths
            avgServ = invoices.reduce((s, inv) => s + Number(inv.services_amount || 0), 0) / totalMonths
        }
    }

    const getTrend = (current: number, previous: number) => {
        if (!previous) return null
        const diff = current - previous
        return { value: Math.abs(diff).toFixed(2), isUp: diff > 0 }
    }

    const trendElec = latestInvoice && prevInvoice
        ? getTrend(Number(latestInvoice.elec_amount), Number(prevInvoice.elec_amount))
        : null
    const trendGas = latestInvoice && prevInvoice
        ? getTrend(Number(latestInvoice.gas_amount), Number(prevInvoice.gas_amount))
        : null

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

            <UtilitiesClient
                invoices={invoices ?? []}
                avgElec={avgElec}
                avgGas={avgGas}
                avgServ={avgServ}
                latestInvoice={latestInvoice}
                prevInvoice={prevInvoice}
                trendElec={trendElec}
                trendGas={trendGas}
            />

        </div>
    )
}
