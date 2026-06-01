'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, X, Loader2 } from 'lucide-react'
import { deleteFixedPattern } from './actions'

type Pattern = { id: string; pattern: string; label: string | null }

export default function FixedPatternsPanel({
  patterns,
  totalFixed,
  fixedTransactions,
  selectedMonth,
  labelMonth,
}: {
  patterns: Pattern[]
  totalFixed: number
  fixedTransactions: { id: string; concepto: string; categoria: string; subcategoria: string | null; importe: number }[]
  selectedMonth: string
  labelMonth: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPatterns, setShowPatterns] = useState(false)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteFixedPattern(id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  if (totalFixed === 0 && patterns.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark size={16} className="text-teal-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-teal-600">Gastos Fijos · {labelMonth}</h3>
      </div>

      {totalFixed > 0 ? (
        <>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-black text-slate-900">{totalFixed.toFixed(2)} €</span>
            <span className="text-sm text-slate-500 font-medium">marcados como fijos este mes</span>
          </div>

          <div className="space-y-2 mb-5">
            {fixedTransactions.sort((a, b) => a.importe - b.importe).map(t => (
              <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-slate-700">{t.concepto}</p>
                  <p className="text-[10px] text-slate-400">{t.categoria}{t.subcategoria ? ` · ${t.subcategoria}` : ''}</p>
                </div>
                <span className="text-sm font-black text-slate-800 shrink-0">{Math.abs(t.importe).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Fondo de emergencia</p>
            <div className="grid grid-cols-3 gap-3">
              {[3, 6, 12].map(m => (
                <div key={m} className={`rounded-xl p-3 text-center border ${m === 6 ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{m} meses{m === 6 ? ' ★' : ''}</p>
                  <p className={`text-lg font-black ${m === 6 ? 'text-teal-700' : 'text-slate-700'}`}>{(totalFixed * m).toFixed(0)} €</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400 mb-5">No hay fijos detectados en {labelMonth}. Los patrones activos se aplicarán al importar los movimientos de ese mes.</p>
      )}

      {patterns.length > 0 && (
        <div>
          <button
            onClick={() => setShowPatterns(v => !v)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            <Bookmark size={10} />
            {patterns.length} patrón{patterns.length !== 1 ? 'es' : ''} activo{patterns.length !== 1 ? 's' : ''} {showPatterns ? '▲' : '▼'}
          </button>
          {showPatterns && (
            <div className="mt-3 space-y-2">
              {patterns.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <span className="text-xs font-mono text-slate-600 truncate flex-1">{p.label ?? p.pattern}</span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    title="Eliminar patrón (no desmarca movimientos existentes)"
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0 ml-2"
                  >
                    {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-slate-300 pt-1">Eliminar un patrón no desmarca los movimientos ya marcados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
