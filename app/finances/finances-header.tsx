'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { importTransactions, deleteAllTransactions } from './actions'

export default function FinancesHeader({ hasData }: { hasData: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setMsg(null)
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const res = await importTransactions(lines)
    setIsImporting(false)
    setMsg(res.error
      ? { type: 'err', text: res.error }
      : { type: 'ok', text: res.skipped && res.skipped > 0
          ? `${res.count} importados · ${res.skipped} ya existían`
          : `${res.count} movimientos importados`
        }
    )
    e.target.value = ''
    setTimeout(() => setMsg(null), 5000)
  }

  const handleDeleteAll = async () => {
    if (!confirm('¿Borrar TODOS los movimientos? Esta acción no se puede deshacer.')) return
    setIsDeletingAll(true)
    await deleteAllTransactions()
    setIsDeletingAll(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleImport} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-sm shadow-sm shadow-blue-100"
      >
        {isImporting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {isImporting ? 'Importando...' : 'Importar'}
      </button>
      {hasData && (
        <button
          onClick={handleDeleteAll}
          disabled={isDeletingAll}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-red-100 transition-all disabled:opacity-50 text-sm"
        >
          {isDeletingAll ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          Borrar todo
        </button>
      )}
      {msg && (
        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </span>
      )}
    </div>
  )
}
