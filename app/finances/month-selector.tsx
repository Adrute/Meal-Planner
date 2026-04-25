'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2, Loader2 } from 'lucide-react'
import { deleteMonthTransactions } from './actions'

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
  const [isDeleting, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  const handleDelete = () => {
    if (!confirm) { setConfirm(true); return }
    setConfirm(false)
    startTransition(async () => {
      await deleteMonthTransactions(selectedMonth)
      router.push('/finances')
    })
  }

  const canDelete = selectedMonth !== 'all'

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={e => { setConfirm(false); router.push(`/finances?month=${e.target.value}`) }}
          className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
        >
          <option value="all">Todos los meses</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{labelMonth(m)}</option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          title={confirm ? 'Confirmar borrado' : `Borrar ${labelMonth(selectedMonth)}`}
          className={`flex items-center gap-1.5 px-3 py-3 rounded-2xl border font-bold text-sm transition-all disabled:opacity-50 shadow-sm ${
            confirm
              ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
              : 'bg-white text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200'
          }`}
        >
          {isDeleting
            ? <Loader2 size={15} className="animate-spin" />
            : <Trash2 size={15} />
          }
          {confirm && <span>¿Confirmar?</span>}
        </button>
      )}
    </div>
  )
}
