'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type HydrationLog = { id: string; date: string; glasses: number }

const GOAL = 8

export default function HydrationChart({ logs }: { logs: HydrationLog[] }) {
  if (logs.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Registra al menos 2 días para ver la gráfica
      </div>
    )
  }

  const data = logs.map(l => ({
    date: format(parseISO(l.date), 'd MMM', { locale: es }),
    vasos: l.glasses,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}v`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
          formatter={(v) => [`${v} vasos`, 'Hidratación']}
        />
        <ReferenceLine y={GOAL} stroke="#bae6fd" strokeDasharray="4 4" label={{ value: 'Objetivo', position: 'right', fontSize: 10, fill: '#7dd3fc' }} />
        <Line
          type="monotone"
          dataKey="vasos"
          stroke="#0ea5e9"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#0ea5e9' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
