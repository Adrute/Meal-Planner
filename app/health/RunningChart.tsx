'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type RunningLog = {
  id: string; date: string; distance_km: number
  duration_minutes: number; feeling: number | null; notes: string | null
}

export default function RunningChart({ logs }: { logs: RunningLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Registra tu primera carrera para ver la gráfica
      </div>
    )
  }

  const data = logs.map(l => ({
    date: format(parseISO(l.date), 'd MMM', { locale: es }),
    km: l.distance_km,
    ritmo: l.duration_minutes > 0 && l.distance_km > 0
      ? Math.round((l.duration_minutes / l.distance_km) * 10) / 10
      : null,
  }))

  return (
    <div className="space-y-6">
      {/* Barras de distancia */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Distancia (km)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}km`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
              formatter={(v) => [`${v} km`, 'Distancia']}
            />
            <Bar dataKey="km" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Línea de ritmo */}
      {logs.length >= 2 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ritmo (min/km)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}'`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
                formatter={(v) => [`${v} min/km`, 'Ritmo']}
              />
              <Line
                type="monotone"
                dataKey="ritmo"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
