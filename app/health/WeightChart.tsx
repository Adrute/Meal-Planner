'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type WeightLog = { id: string; date: string; weight_kg: number; notes: string | null }

export default function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Registra al menos 2 pesadas para ver la gráfica
      </div>
    )
  }

  const data = logs.map(l => ({
    date: format(parseISO(l.date), 'd MMM', { locale: es }),
    peso: l.weight_kg,
  }))

  const weights = logs.map(l => l.weight_kg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length
  const domain = [Math.floor(min - 1), Math.ceil(max + 1)]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis domain={domain} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
          formatter={(v) => [`${v} kg`, 'Peso']}
        />
        <ReferenceLine y={avg} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="peso"
          stroke="#f43f5e"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#f43f5e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
