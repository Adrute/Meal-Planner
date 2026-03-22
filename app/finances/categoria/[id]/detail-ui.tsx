'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TransactionRow } from '../../finances-ui'
import { type Category } from '../../constants'

type MonthEntry = { label: string; key: string; total: number }
type SubcatStat = { name: string; total: number; pct: number }

export default function CategoryDetailUI({
  transactions,
  availableMonths,
  selectedMonth,
  categories,
  categoryColor,
  subcatStats,
  monthlyEvolution,
}: {
  transactions: { id: string; fecha_operacion: string; concepto: string; concepto_original: string; importe: number; categoria: string; subcategoria: string | null; tarjeta: string | null }[]
  availableMonths: string[]
  selectedMonth: string
  categories: Category[]
  categoryColor: string
  subcatStats: SubcatStat[]
  monthlyEvolution: MonthEntry[]
}) {
  const [search, setSearch] = useState('')
  const [subcatFilter, setSubcatFilter] = useState('Todas')

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = search === '' ||
        t.concepto.toLowerCase().includes(search.toLowerCase()) ||
        t.concepto_original.toLowerCase().includes(search.toLowerCase())
      const matchSubcat = subcatFilter === 'Todas' || (subcatFilter === '__sin__' ? !t.subcategoria : t.subcategoria === subcatFilter)
      return matchSearch && matchSubcat
    })
  }, [transactions, search, subcatFilter])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const t of filtered) {
      if (!map.has(t.fecha_operacion)) map.set(t.fecha_operacion, [])
      map.get(t.fecha_operacion)!.push(t)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const subcatNames = subcatStats.map(s => s.name)
  const maxTotal = Math.max(...monthlyEvolution.map(m => m.total), 1)

  return (
    <div className="space-y-6">

      {/* GRÁFICO EVOLUCIÓN */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
          Evolución mensual · últimos 12 meses
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyEvolution} barCategoryGap="30%">
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${v}€`} />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0).toFixed(0)} €`]}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Bar dataKey="total" name="Gastos" radius={[5, 5, 0, 0]}>
              {monthlyEvolution.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.key === selectedMonth ? categoryColor : categoryColor + '55'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* DESGLOSE SUBCATEGORÍAS */}
      {subcatStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
            Desglose por subcategoría
          </h3>
          <div className="space-y-3">
            {subcatStats.map(sub => (
              <div key={sub.name}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-700 flex-1">{sub.name}</span>
                  <span className="text-sm font-black text-slate-800">{sub.total.toFixed(0)} €</span>
                  <span className="text-[10px] text-slate-400 w-8 text-right">{sub.pct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${sub.pct}%`, background: categoryColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACCIONES */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Movimientos</p>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-400"
            />
          </div>
          {subcatNames.length > 0 && (
            <div className="relative">
              <select
                value={subcatFilter}
                onChange={e => setSubcatFilter(e.target.value)}
                className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:border-blue-400 appearance-none cursor-pointer"
              >
                <option value="Todas">Todas las subcategorías</option>
                {subcatNames.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__sin__">Sin subcategoría</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        <p className="text-xs font-bold text-slate-400 mb-3 ml-1">
          {filtered.length} movimientos · Gastos: {Math.abs(filtered.filter(t => t.importe < 0).reduce((s, t) => s + t.importe, 0)).toFixed(0)} €
          {filtered.some(t => t.importe > 0) && ` · Abonos: ${filtered.filter(t => t.importe > 0).reduce((s, t) => s + t.importe, 0).toFixed(0)} €`}
        </p>

        {filtered.length === 0
          ? <p className="text-center text-slate-300 text-sm py-10">Sin movimientos</p>
          : (
            <div className="space-y-4">
              {groupedByDate.map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    {formatDate(date)}
                  </p>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                    {items.map(t => (
                      <TransactionRow key={t.id} transaction={t} categories={categories} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}
