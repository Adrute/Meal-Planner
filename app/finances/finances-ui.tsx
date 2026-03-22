'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  importTransactions, updateTransaction, deleteTransaction,
  deleteAllTransactions, createRule, deleteRule, reapplyRules,
} from './actions'
import { CATEGORY_COLORS, type Category } from './constants'
import {
  Upload, Trash2, Loader2, Pencil, Check, X,
  ChevronDown, Search, Filter, BookMarked, RefreshCw, Tag, ArrowRight,
  Download, FileText, FileSpreadsheet,
} from 'lucide-react'

type Transaction = {
  id: string
  fecha_operacion: string
  concepto: string
  concepto_original: string
  importe: number
  categoria: string
  subcategoria: string | null
  tarjeta: string | null
}

type Rule = { id: string; pattern: string; categoria: string; subcategoria: string | null }

export default function FinancesUI({
  transactions,
  rules: initialRules,
  categories,
}: {
  transactions: Transaction[]
  rules: Rule[]
  categories: Category[]
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [subcatFilter, setSubcatFilter] = useState('Todas')

  const handleCatFilterChange = (cat: string) => {
    setCatFilter(cat)
    setSubcatFilter('Todas')
  }

  const selectedCatSubcats = categories.find(c => c.name === catFilter)?.transaction_subcategories ?? []

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = search === '' ||
        t.concepto.toLowerCase().includes(search.toLowerCase()) ||
        t.concepto_original.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'Todas' || t.categoria === catFilter
      const matchSubcat = subcatFilter === 'Todas' || t.subcategoria === subcatFilter
      return matchSearch && matchCat && matchSubcat
    })
  }, [transactions, search, catFilter, subcatFilter])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      if (!map.has(t.fecha_operacion)) map.set(t.fecha_operacion, [])
      map.get(t.fecha_operacion)!.push(t)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportMsg(null)
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const res = await importTransactions(lines)
    setIsImporting(false)
    setImportMsg(res.error
      ? { type: 'err', text: res.error }
      : { type: 'ok', text: `${res.count} movimientos importados. Reglas aplicadas.` }
    )
    e.target.value = ''
  }

  const handleDeleteAll = async () => {
    if (!confirm('¿Borrar TODOS los movimientos? Esta acción no se puede deshacer.')) return
    setIsDeletingAll(true)
    await deleteAllTransactions()
    setIsDeletingAll(false)
  }

  const categoryNames = categories.map(c => c.name)

  return (
    <div className="space-y-6">

      {/* BARRA DE ACCIONES */}
      <div className="flex flex-wrap gap-3 items-center">
        <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-3 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
        >
          {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {isImporting ? 'Importando...' : 'Importar fichero'}
        </button>
        {transactions.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={isDeletingAll}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-red-100 transition-all disabled:opacity-50"
          >
            {isDeletingAll ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Borrar todo
          </button>
        )}
        {importMsg && (
          <span className={`text-sm font-medium px-4 py-2 rounded-xl ${importMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {importMsg.text}
          </span>
        )}
        {filtered.length > 0 && (
          <div className="ml-auto">
            <ExportMenu transactions={filtered} />
          </div>
        )}
      </div>

      {/* PANEL DE REGLAS */}
      <RulesPanel rules={initialRules} categories={categories} />

      {transactions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <Upload size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Importa tu fichero de movimientos del Sabadell<br />para empezar a ver tus finanzas.</p>
        </div>
      ) : (
        <>
          {/* FILTROS */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar movimiento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={catFilter}
                onChange={e => handleCatFilterChange(e.target.value)}
                className="pl-8 pr-8 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:border-blue-400 appearance-none cursor-pointer"
              >
                <option value="Todas">Todas las categorías</option>
                {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {selectedCatSubcats.length > 0 && (
              <div className="relative">
                <select
                  value={subcatFilter}
                  onChange={e => setSubcatFilter(e.target.value)}
                  className="pl-4 pr-8 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:border-blue-400 appearance-none cursor-pointer"
                >
                  <option value="Todas">Todas las subcategorías</option>
                  {selectedCatSubcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-slate-400 ml-1">
            {filtered.length} movimientos · Gastos: <span className="text-red-500">{Math.abs(filtered.filter(t => t.importe < 0).reduce((s, t) => s + t.importe, 0)).toFixed(2)} €</span>
            {' · '}Ingresos: <span className="text-emerald-600">{filtered.filter(t => t.importe > 0).reduce((s, t) => s + t.importe, 0).toFixed(2)} €</span>
          </div>

          <div className="space-y-4">
            {groupedByDate.map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {formatDate(date)}
                </p>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {items.map(t => (
                    <TransactionRow key={t.id} transaction={t} categories={categories} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── PANEL DE REGLAS ──────────────────────────────────────────────────────────

function RulesPanel({ rules, categories }: { rules: Rule[]; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [isReapplying, setIsReapplying] = useState(false)
  const [reapplyMsg, setReapplyMsg] = useState<string | null>(null)

  const handleReapply = async () => {
    setIsReapplying(true)
    setReapplyMsg(null)
    const res = await reapplyRules()
    setIsReapplying(false)
    setReapplyMsg(res.count === 0 ? 'No había movimientos que actualizar.' : `${res.count} movimientos recategorizados.`)
    setTimeout(() => setReapplyMsg(null), 4000)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <BookMarked size={16} className="text-blue-500" />
          <span className="text-sm font-black text-slate-700">Reglas de categorización</span>
          {rules.length > 0 && (
            <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{rules.length}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          <p className="text-xs text-slate-400">Si el concepto contiene el patrón, se asigna esa categoría y subcategoría automáticamente al importar.</p>
          {rules.length === 0
            ? <p className="text-sm text-slate-300 text-center py-4">Sin reglas. Edita un movimiento para crear una.</p>
            : <div className="space-y-2">{rules.map(r => <RuleRow key={r.id} rule={r} />)}</div>
          }
          <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
            <button
              onClick={handleReapply}
              disabled={isReapplying || rules.length === 0}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 transition-colors"
            >
              {isReapplying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Reaplicar a todos los movimientos
            </button>
            {reapplyMsg && <span className="text-xs text-emerald-600 font-bold">{reapplyMsg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function RuleRow({ rule }: { rule: Rule }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const colorClass = CATEGORY_COLORS[rule.categoria] ?? 'bg-gray-100 text-gray-600'
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 ${isDeleting ? 'opacity-40' : ''}`}>
      <Tag size={13} className="text-slate-400 shrink-0" />
      <span className="text-sm font-mono font-bold text-slate-600 flex-1 truncate">{rule.pattern}</span>
      <ArrowRight size={13} className="text-slate-300 shrink-0" />
      <div className="flex flex-col items-end shrink-0">
        <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${colorClass}`}>{rule.categoria}</span>
        {rule.subcategoria && <span className="text-[9px] text-slate-400 mt-0.5">{rule.subcategoria}</span>}
      </div>
      <button onClick={async () => { setIsDeleting(true); await deleteRule(rule.id) }} disabled={isDeleting} className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0">
        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
      </button>
    </div>
  )
}

// ─── FILA DE TRANSACCIÓN ──────────────────────────────────────────────────────

export function TransactionRow({ transaction: t, categories }: { transaction: Transaction; categories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [concepto, setConcepto] = useState(t.concepto)
  const [categoria, setCategoria] = useState(t.categoria)
  const [subcategoria, setSubcategoria] = useState(t.subcategoria || '')
  const [createRuleEnabled, setCreateRuleEnabled] = useState(false)
  const [rulePattern, setRulePattern] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Subcategorías disponibles para la categoría seleccionada
  const subcats = categories.find(c => c.name === categoria)?.transaction_subcategories ?? []

  const handleCatChange = (newCat: string) => {
    setCategoria(newCat)
    setSubcategoria('')
  }

  const handleEdit = () => {
    setRulePattern(t.concepto_original)
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await updateTransaction(t.id, concepto, categoria, subcategoria || null)
    if (createRuleEnabled && rulePattern.trim()) {
      await createRule(rulePattern.trim(), categoria, subcategoria || null)
    }
    setIsSaving(false)
    setIsEditing(false)
    setCreateRuleEnabled(false)
  }

  const handleCancel = () => {
    setConcepto(t.concepto)
    setCategoria(t.categoria)
    setSubcategoria(t.subcategoria || '')
    setCreateRuleEnabled(false)
    setIsEditing(false)
  }

  const colorClass = CATEGORY_COLORS[categoria] ?? 'bg-gray-100 text-gray-600'
  const isIncome = t.importe > 0

  return (
    <div className={`transition-colors group ${isDeleting ? 'opacity-40' : ''}`}>
      <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">

        {/* Categoría + subcategoría */}
        {isEditing ? (
          <div className="flex flex-col gap-1 shrink-0">
            <select
              value={categoria}
              onChange={e => handleCatChange(e.target.value)}
              className="text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 cursor-pointer"
            >
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {subcats.length > 0 && (
              <select
                value={subcategoria}
                onChange={e => setSubcategoria(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 cursor-pointer text-slate-500"
              >
                <option value="">Sin subcategoría</option>
                {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 shrink-0">
            <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${colorClass}`}>
              {categoria}
            </span>
            {t.subcategoria && (
              <span className="text-[9px] text-slate-400 text-center font-medium">{t.subcategoria}</span>
            )}
          </div>
        )}

        {/* Concepto */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              className="w-full text-sm font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400"
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700 truncate">{concepto}</p>
              <p className="text-[10px] text-slate-400 truncate">{t.concepto_original}</p>
            </>
          )}
        </div>

        {/* Importe */}
        <span className={`text-sm font-black shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
          {isIncome ? '+' : ''}{Number(t.importe).toFixed(2)} €
        </span>

        {/* Botones */}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={isSaving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50">
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              </button>
              <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <Pencil size={14} />
              </button>
              <button onClick={async () => { setIsDeleting(true); await deleteTransaction(t.id) }} disabled={isDeleting} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50">
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Panel crear regla */}
      {isEditing && (
        <div className="px-4 pb-3 pt-2 border-t border-slate-50 bg-slate-50/50 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={createRuleEnabled}
              onChange={e => setCreateRuleEnabled(e.target.checked)}
              className="rounded accent-blue-500"
            />
            <span className="text-xs font-bold text-slate-500">Crear regla para futuros movimientos</span>
          </label>
          {createRuleEnabled && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 shrink-0">Si contiene:</span>
              <input
                type="text"
                value={rulePattern}
                onChange={e => setRulePattern(e.target.value)}
                className="flex-1 min-w-[160px] text-xs font-mono font-bold border border-blue-200 bg-white rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 text-slate-700"
              />
              <ArrowRight size={13} className="text-slate-300 shrink-0" />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${CATEGORY_COLORS[categoria] ?? 'bg-gray-100 text-gray-600'}`}>{categoria}</span>
                {subcategoria && <span className="text-[9px] text-slate-400 text-center">{subcategoria}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

// ─── EXPORTACIÓN ──────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ExportMenu({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCSV = () => {
    const headers = ['Fecha', 'Concepto', 'Concepto original', 'Importe', 'Categoría', 'Subcategoría', 'Tarjeta']
    const rows = transactions.map(t => [
      t.fecha_operacion, t.concepto, t.concepto_original,
      t.importe, t.categoria, t.subcategoria ?? '', t.tarjeta ?? '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), 'movimientos.csv')
    setOpen(false)
  }

  const handleExcel = () => {
    const wb = XLSX.utils.book_new()

    // Hoja 1 — Movimientos en bruto
    const movRows = [
      ['Fecha', 'Concepto', 'Concepto original', 'Importe (€)', 'Categoría', 'Subcategoría', 'Tarjeta'],
      ...transactions.map(t => [
        t.fecha_operacion, t.concepto, t.concepto_original,
        Number(t.importe), t.categoria, t.subcategoria ?? '', t.tarjeta ?? '',
      ]),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(movRows)
    ws1['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 50 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Movimientos')

    // Hoja 2 — Por categoría y subcategoría
    const catMap: Record<string, { gastos: number; ingresos: number; n: number }> = {}
    const subcatMap: Record<string, number> = {}
    for (const t of transactions) {
      if (!catMap[t.categoria]) catMap[t.categoria] = { gastos: 0, ingresos: 0, n: 0 }
      if (t.importe < 0) { catMap[t.categoria].gastos += Math.abs(Number(t.importe)); catMap[t.categoria].n++ }
      else catMap[t.categoria].ingresos += Number(t.importe)
      if (t.subcategoria && t.importe < 0) {
        const k = `${t.categoria}|||${t.subcategoria}`
        subcatMap[k] = (subcatMap[k] || 0) + Math.abs(Number(t.importe))
      }
    }
    const totalGastos = Object.values(catMap).reduce((s, c) => s + c.gastos, 0)
    const catRows: (string | number)[][] = [
      ['Categoría', 'Subcategoría', 'Gastos (€)', 'Ingresos (€)', 'Nº movimientos', '% del total'],
    ]
    for (const [cat, stats] of Object.entries(catMap).sort((a, b) => b[1].gastos - a[1].gastos)) {
      const pct = totalGastos > 0 ? parseFloat((stats.gastos / totalGastos * 100).toFixed(1)) : 0
      catRows.push([cat, '', stats.gastos, stats.ingresos, stats.n, pct])
      for (const [k, amount] of Object.entries(subcatMap).filter(([k]) => k.startsWith(`${cat}|||`)).sort((a, b) => b[1] - a[1])) {
        const sub = k.split('|||')[1]
        const subPct = totalGastos > 0 ? parseFloat((amount / totalGastos * 100).toFixed(1)) : 0
        catRows.push(['', sub, amount, '', '', subPct])
      }
    }
    const ws2 = XLSX.utils.aoa_to_sheet(catRows)
    ws2['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Por categoría')

    // Hoja 3 — Evolución mensual
    const monthMap: Record<string, { gastos: number; ingresos: number }> = {}
    for (const t of transactions) {
      const m = t.fecha_operacion.substring(0, 7)
      if (!monthMap[m]) monthMap[m] = { gastos: 0, ingresos: 0 }
      if (t.importe < 0) monthMap[m].gastos += Math.abs(Number(t.importe))
      else monthMap[m].ingresos += Number(t.importe)
    }
    const monthRows = [
      ['Mes', 'Gastos (€)', 'Ingresos (€)', 'Balance (€)'],
      ...Object.entries(monthMap)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([m, s]) => [m, s.gastos, s.ingresos, parseFloat((s.ingresos - s.gastos).toFixed(2))]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(monthRows)
    ws3['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Evolución mensual')

    XLSX.writeFile(wb, 'finanzas.xlsx')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-slate-600 font-bold px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
      >
        <Download size={16} />
        Exportar
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20 w-52">
          <button
            onClick={handleCSV}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <FileText size={16} className="text-slate-400 shrink-0" />
            <div>
              <p className="font-bold">CSV</p>
              <p className="text-[10px] text-slate-400">Datos en bruto del filtro</p>
            </div>
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={handleExcel}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold">Excel (.xlsx)</p>
              <p className="text-[10px] text-slate-400">Movimientos + análisis</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

