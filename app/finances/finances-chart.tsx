'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts'
import { Layers } from 'lucide-react'

type MonthlyEntry = { label: string; gastos: number; ingresos: number }
type SubcatEvolution = Record<string, { data: Record<string, number | string>[]; subcats: string[] }>

// Paleta de colores para subcategorías
const SUBCAT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#64748b',
]

export default function EvolutionChart({
  monthlyData,
  catEvolution,
  allCats,
  defaultActiveCats,
  catColors,
  mediaGastos,
  subcatEvolution,
}: {
  monthlyData: MonthlyEntry[]
  catEvolution: Record<string, number | string>[]
  allCats: string[]
  defaultActiveCats: string[]
  catColors: Record<string, string>
  mediaGastos: number
  subcatEvolution: SubcatEvolution
}) {
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set(defaultActiveCats))

  const toggle = (cat: string) => {
    setActiveCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size <= 1) return prev
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const visibleCats = allCats.filter(c => activeCats.has(c))

  // Modo subcategoría: cuando solo hay 1 categoría activa y tiene subcats con datos
  const isSubcatMode = activeCats.size === 1
  const singleCat = isSubcatMode ? [...activeCats][0] : null
  const subcatData = singleCat ? subcatEvolution[singleCat] : null
  const showSubcats = isSubcatMode && subcatData && subcatData.subcats.length > 1

  return (
    <div className="space-y-4">

      {/* Evolución gastos vs ingresos — 12 meses */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
          Evolución gastos vs ingresos · últimos 12 meses
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={2} barCategoryGap="30%">
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${v}€`} />
            <Tooltip
              formatter={(value, name) => [`${Number(value ?? 0).toFixed(0)} €`, String(name ?? '')]}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Legend formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
            {mediaGastos > 0 && (
              <ReferenceLine y={mediaGastos} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'Media', position: 'insideTopRight', fontSize: 10, fill: '#fbbf24' }} />
            )}
            <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[5, 5, 0, 0]} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#34d399" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evolución categorías con toggles */}
      {allCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Evolución por categoría · últimos 12 meses
            </h3>
            {showSubcats && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
                <Layers size={11} />
                Vista por subcategoría
              </div>
            )}
          </div>

          {/* Toggle pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {allCats.map(cat => {
              const active = activeCats.has(cat)
              const color = catColors[cat] ?? '#94a3b8'
              return (
                <button
                  key={cat}
                  onClick={() => toggle(cat)}
                  className="text-[11px] font-bold px-3 py-1 rounded-full border transition-all"
                  style={
                    active
                      ? { background: color, borderColor: color, color: '#fff' }
                      : { background: 'transparent', borderColor: '#e2e8f0', color: '#94a3b8' }
                  }
                >
                  {cat}
                </button>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            {showSubcats ? (
              // ── Modo subcategoría ──
              <LineChart data={subcatData!.data}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${v}€`} />
                <Tooltip
                  formatter={(value, name) => [`${Number(value ?? 0).toFixed(0)} €`, String(name ?? '')]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                {subcatData!.subcats.map((sub, i) => (
                  <Line
                    key={sub}
                    type="monotone"
                    dataKey={sub}
                    stroke={SUBCAT_COLORS[i % SUBCAT_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            ) : (
              // ── Modo categoría (normal) ──
              <LineChart data={catEvolution}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${v}€`} />
                <Tooltip
                  formatter={(value, name) => [`${Number(value ?? 0).toFixed(0)} €`, String(name ?? '')]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                {visibleCats.map(cat => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={catColors[cat] ?? '#94a3b8'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
