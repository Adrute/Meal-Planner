'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

function labelMonth(ymStr: string) {
  if (ymStr === 'all') return 'Todos los meses'
  const [y, m] = ymStr.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${months[parseInt(m) - 1]} ${y}`
}

export default function MonthSelector({
  availableMonths,
  selectedMonth,
}: {
  availableMonths: string[]
  selectedMonth: string
}) {
  const router = useRouter()

  return (
    <div className="relative">
      <select
        value={selectedMonth}
        onChange={e => router.push(`/finances?month=${e.target.value}`)}
        className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
      >
        <option value="all">Todos los meses</option>
        {availableMonths.map(m => (
          <option key={m} value={m}>{labelMonth(m)}</option>
        ))}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}
