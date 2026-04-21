'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type RunningLog = {
  id: string; date: string; distance_km: number
  duration_minutes: number; feeling: number | null; notes: string | null
}

function formatPace(minPerKm: number) {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}'${s.toString().padStart(2, '0')}"`
}

export default function RunningChart({ logs }: { logs: RunningLog[] }) {
  if (logs.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Registra al menos 2 salidas para ver la gráfica
      </div>
    )
  }

  const data = logs
    .filter(l => l.duration_minutes > 0 && l.distance_km > 0)
    .map(l => ({
      date: format(parseISO(l.date), 'd MMM', { locale: es }),
      ritmo: Math.round((l.duration_minutes / l.distance_km) * 100) / 100,
    }))

  const avgPace = data.reduce((s, d) => s + d.ritmo, 0) / data.length
  const sharedAxis = { fontSize: 11, fill: '#94a3b8' }

  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Evolución del ritmo (min/km)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={sharedAxis} tickLine={false} axisLine={false} />
          <YAxis
            tick={sharedAxis} tickLine={false} axisLine={false}
            tickFormatter={v => formatPace(v)}
            domain={['auto', 'auto']}
            width={40}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
            formatter={(v) => [formatPace(Number(v)), 'Ritmo']}
          />
          <ReferenceLine y={avgPace} stroke="#c4b5fd" strokeDasharray="4 4"
            label={{ value: `Media ${formatPace(avgPace)}`, position: 'insideTopRight', fontSize: 10, fill: '#a78bfa' }} />
          <Line type="monotone" dataKey="ritmo" stroke="#f43f5e" strokeWidth={2.5}
            dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
