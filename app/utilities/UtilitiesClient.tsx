'use client'

import { useState, useEffect } from 'react'
import { Zap, Flame, BarChart3, FileText, Wrench, TableProperties, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import ExportCsvButton from './export-csv'
import UtilitiesLineChart from './line-chart'

type Invoice = {
  id: string
  invoice_number: string | null
  issue_date: string
  billing_period_months: number | null
  elec_amount: number | null
  gas_amount: number | null
  services_amount: number | null
  taxes_amount: number | null
  total_amount: number | null
}

type Trend = { value: string; isUp: boolean } | null

type AggregatedMonth = {
  issue_date: string
  elec_amount: number
  gas_amount: number
  services_amount: number
  taxes_amount: number
  elec_kwh: number
  gas_kwh: number
  billing_period_months: number
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TODAY = fmtDate(new Date())
const YEAR_START = `${new Date().getFullYear()}-01-01`

export default function UtilitiesClient({
  invoices,
  avgElec,
  avgGas,
  avgServ,
  latestInvoice,
  prevInvoice,
  trendElec,
  trendGas,
}: {
  invoices: Invoice[]
  avgElec: number
  avgGas: number
  avgServ: number
  latestInvoice: Invoice | null
  prevInvoice: Invoice | null
  trendElec: Trend
  trendGas: Trend
}) {
  const hasData = invoices.length > 0

  const [dateFrom, setDateFrom] = useState(YEAR_START)
  const [dateTo, setDateTo] = useState(TODAY)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { setCurrentPage(1) }, [dateFrom, dateTo, pageSize])

  const filteredInvoices = invoices.filter(inv => {
    if (dateFrom && inv.issue_date < dateFrom) return false
    if (dateTo && inv.issue_date > dateTo) return false
    return true
  })

  const aggregatedByMonth: AggregatedMonth[] = (() => {
    const map = new Map<string, AggregatedMonth>()
    for (const inv of filteredInvoices) {
      const d = new Date(inv.issue_date)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      const existing = map.get(key)
      if (existing) {
        existing.elec_amount += Number(inv.elec_amount || 0)
        existing.gas_amount += Number(inv.gas_amount || 0)
        existing.services_amount += Number(inv.services_amount || 0)
        existing.taxes_amount += Number(inv.taxes_amount || 0)
        existing.billing_period_months += Number(inv.billing_period_months || 0)
      } else {
        map.set(key, {
          issue_date: `${key}-01`,
          elec_amount: Number(inv.elec_amount || 0),
          gas_amount: Number(inv.gas_amount || 0),
          services_amount: Number(inv.services_amount || 0),
          taxes_amount: Number(inv.taxes_amount || 0),
          elec_kwh: 0,
          gas_kwh: 0,
          billing_period_months: Number(inv.billing_period_months || 0),
        })
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  })()

  const totalItems = filteredInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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

        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600"><Flame size={20} /></div>
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 bg-white"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 bg-white"
          />
        </label>
        <button
          onClick={() => { setDateFrom(YEAR_START); setDateTo(TODAY) }}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><BarChart3 size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Evolución por Servicio</h2>
        </div>

        {aggregatedByMonth.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 mt-6">
            <FileText size={48} className="mb-4 opacity-50 text-slate-400" />
            <p className="font-medium text-center px-4">No hay facturas en el rango seleccionado.</p>
          </div>
        ) : (
          <UtilitiesLineChart data={aggregatedByMonth} />
        )}
      </section>

      <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><TableProperties size={20} /></div>
            <h2 className="font-bold text-xl text-slate-800">Histórico de Facturas</h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Filas:</span>
              {([10, 20, 50] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${pageSize === size ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            {filteredInvoices.length > 0 && <ExportCsvButton invoices={filteredInvoices} />}
          </div>
        </div>

        {totalItems > 0 && (
          <p className="text-xs text-slate-400 font-medium mb-4">
            Mostrando {rangeStart}–{rangeEnd} de {totalItems} facturas
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-4 rounded-tl-xl">Fecha Emisión</th>
                <th className="px-4 py-4 hidden sm:table-cell">Período</th>
                <th className="px-4 py-4">Luz</th>
                <th className="px-4 py-4">Gas</th>
                <th className="px-4 py-4">Facilita</th>
                <th className="px-4 py-4">Impuestos</th>
                <th className="px-4 py-4 rounded-tr-xl text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {new Date(inv.issue_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-slate-500 font-medium">
                      {(inv.billing_period_months ?? 1) === 1 ? '1 mes' : `${inv.billing_period_months ?? 1} meses`}
                    </td>
                    <td className="px-4 py-4 text-yellow-600 font-medium">{Number(inv.elec_amount).toFixed(2)} €</td>
                    <td className="px-4 py-4 text-teal-600 font-medium">{Number(inv.gas_amount).toFixed(2)} €</td>
                    <td className="px-4 py-4 text-emerald-600 font-medium">{Number(inv.services_amount).toFixed(2)} €</td>
                    <td className="px-4 py-4 text-slate-400">{Number(inv.taxes_amount).toFixed(2)} €</td>
                    <td className="px-4 py-4 font-black text-slate-900 text-right">{Number(inv.total_amount).toFixed(2)} €</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin datos en el rango seleccionado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-500">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </>
  )
}
