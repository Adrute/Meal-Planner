'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts'

type MonthlyEntry = { label: string; gastos: number; ingresos: number }

export default function EvolutionChart({
  monthlyData,
  catEvolution,
  allCats,
  defaultActiveCats,
  catColors,
  mediaGastos,
}: {
  monthlyData: MonthlyEntry[]
  catEvolution: Record<string, number | string>[]
  allCats: string[]
  defaultActiveCats: string[]
  catColors: Record<string, string>
  mediaGastos: number
}) {
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set(defaultActiveCats))

  const toggle = (cat: string) => {
    setActiveCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size <= 1) return prev // mantener al menos una
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const visibleCats = allCats.filter(c => activeCats.has(c))

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
              formatter={(value: number, name: string) => [`${value.toFixed(0)} €`, name]}
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
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Evolución por categoría · últimos 12 meses
          </h3>

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
            <LineChart data={catEvolution}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${v}€`} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value.toFixed(0)} €`, name]}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
              />
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
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
