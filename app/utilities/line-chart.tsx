'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function UtilitiesLineChart({ data }: { data: any[] }) {
  // Damos formato a los datos para que la librería los lea fácilmente
  const formattedData = data.map(inv => {
    const dateObj = new Date(inv.issue_date);
    return {
      name: dateObj.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).replace('.', '').toUpperCase(),
      Luz: Number(inv.elec_amount),
      Gas: Number(inv.gas_amount),
      Servicios: Number(inv.services_amount),
      Impuestos: Number(inv.taxes_amount)
    }
  })

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
            dy={10} 
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            tickFormatter={(value) => `${value}€`}
          />
          
          <Tooltip
            cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: '900', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}
            itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }}
          />
          
          <Legend 
            wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '20px' }} 
            iconType="circle" 
          />
          
          <Line type="monotone" dataKey="Luz" stroke="#facc15" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Gas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Servicios" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Impuestos" stroke="#cbd5e1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}