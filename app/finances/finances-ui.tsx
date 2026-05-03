'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  updateTransaction, deleteTransaction,
  createRule, deleteRule, reapplyRules,
  bulkUpdateCategory, toggleNeedsReview,
} from './actions'
import { CATEGORY_COLORS, type Category } from './constants'
import {
  Upload, Loader2, Pencil, Check, X,
  ChevronDown, Search, Filter, BookMarked, RefreshCw, Tag, ArrowRight,
  Download, FileText, FileSpreadsheet, CheckSquare, Square, Flag, ClipboardList,
  Layers, Trash2,
} from 'lucide-react'
import Modal from '@/components/Modal'
import CategoriesManager from './categories-manager'

type Transaction = {
  id: string
  fecha_operacion: string
  concepto: string
  concepto_original: string
  importe: number
  categoria: string
  subcategoria: string | null
  tarjeta: string | null
  needs_review?: boolean
}

type Rule = { id: string; pattern: string; categoria: string; subcategoria: string | null }

export default function FinancesUI({
  transactions,
  allTransactions,
  rules: initialRules,
  categories,
}: {
  transactions: Transaction[]
  allTransactions: Transaction[]
  rules: Rule[]
  categories: Category[]
}) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [subcatFilter, setSubcatFilter] = useState('Todas')
  const [flowFilter, setFlowFilter] = useState<'todos' | 'gastos' | 'ingresos'>('todos')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [modalCats, setModalCats] = useState(false)
  const [modalRules, setModalRules] = useState(false)
  const [modalReview, setModalReview] = useState(false)
  const [modalExport, setModalExport] = useState(false)

  const pendingCount = allTransactions.filter(t => t.needs_review).length
  const pendingInView = allTransactions.filter(t => t.needs_review)

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
      const matchFlow = flowFilter === 'todos' || (flowFilter === 'gastos' ? t.importe < 0 : t.importe > 0)
      return matchSearch && matchCat && matchSubcat && matchFlow
    })
  }, [transactions, search, catFilter, subcatFilter, flowFilter])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      if (!map.has(t.fecha_operacion)) map.set(t.fecha_operacion, [])
      map.get(t.fecha_operacion)!.push(t)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const categoryNames = categories.map(c => c.name)

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const allSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id))
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(filtered.map(t => t.id)))
  const clearSelection = () => setSelectedIds(new Set())

  return (
    <div className="space-y-4">

      {/* BARRA DE ACCIÓN */}
      <div className="flex items-center gap-2 flex-wrap">
        <ActionButton icon={<Layers size={15} />} label="Categorías" onClick={() => setModalCats(true)} />
        <ActionButton icon={<BookMarked size={15} />} label="Reglas" count={initialRules.length} onClick={() => setModalRules(true)} />
        <ActionButton
          icon={<ClipboardList size={15} />}
          label="Revisión"
          count={pendingCount}
          countColor="bg-amber-100 text-amber-600"
          onClick={() => setModalReview(true)}
          disabled={pendingCount === 0}
        />
        {filtered.length > 0 && (
          <ActionButton icon={<Download size={15} />} label="Exportar" onClick={() => setModalExport(true)} />
        )}
      </div>

      {/* MODALES */}
      <Modal isOpen={modalCats} onClose={() => setModalCats(false)} title="Categorías y subcategorías" size="lg">
        <CategoriesManager categories={categories} embedded />
      </Modal>

      <Modal isOpen={modalRules} onClose={() => setModalRules(false)} title="Reglas de categorización" size="lg">
        <RulesPanelContent rules={initialRules} categories={categories} onClose={() => setModalRules(false)} />
      </Modal>

      <Modal isOpen={modalReview} onClose={() => setModalReview(false)} title={`Pendientes de revisión · ${pendingCount}`} size="lg">
        <ReviewPanelContent transactions={pendingInView} categories={categories} />
      </Modal>

      <Modal isOpen={modalExport} onClose={() => setModalExport(false)} title="Exportar movimientos" size="sm">
        <ExportOptions transactions={filtered} onClose={() => setModalExport(false)} />
      </Modal>

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

            {/* Filtro ingresos / gastos */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(['todos', 'gastos', 'ingresos'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFlowFilter(opt)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    flowFilter === opt
                      ? opt === 'gastos'
                        ? 'bg-white text-rose-500 shadow-sm'
                        : opt === 'ingresos'
                          ? 'bg-white text-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt === 'todos' ? 'Todos' : opt === 'gastos' ? '↓ Gastos' : '↑ Ingresos'}
                </button>
              ))}
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

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              {allSelected
                ? <CheckSquare size={15} className="text-blue-500" />
                : <Square size={15} />
              }
              {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <span className="text-xs font-bold text-slate-400">
              {filtered.length} movimientos · Gastos: <span className="text-red-500">{Math.abs(filtered.filter(t => t.importe < 0).reduce((s, t) => s + t.importe, 0)).toFixed(2)} €</span>
              {' · '}Ingresos: <span className="text-emerald-600">{filtered.filter(t => t.importe > 0).reduce((s, t) => s + t.importe, 0).toFixed(2)} €</span>
            </span>
          </div>

          <div className="space-y-4">
            {groupedByDate.map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {formatDate(date)}
                </p>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {items.map(t => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      categories={categories}
                      isSelected={selectedIds.has(t.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <BulkActionBar
              count={selectedIds.size}
              categories={categories}
              selectedIds={selectedIds}
              onClear={clearSelection}
              onDone={clearSelection}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── CONTENIDO MODAL REGLAS ───────────────────────────────────────────────────

function RulesPanelContent({ rules, categories, onClose: _onClose }: { rules: Rule[]; categories: Category[]; onClose: () => void }) {
  const router = useRouter()
  const [isReapplying, setIsReapplying] = useState(false)
  const [reapplyMsg, setReapplyMsg] = useState<string | null>(null)

  const handleReapply = async () => {
    setIsReapplying(true)
    setReapplyMsg(null)
    const res = await reapplyRules()
    router.refresh()
    setIsReapplying(false)
    if ('error' in res && res.error) {
      setReapplyMsg(`Error: ${res.error}`)
    } else {
      setReapplyMsg(res.count === 0 ? 'No había movimientos que actualizar.' : `${res.count} movimientos recategorizados.`)
    }
    setTimeout(() => setReapplyMsg(null), 6000)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Si el concepto contiene el patrón, se asigna esa categoría automáticamente al importar.</p>
      {rules.length === 0
        ? <p className="text-sm text-slate-300 text-center py-8">Sin reglas. Edita un movimiento para crear una.</p>
        : <div className="space-y-2">{rules.map(r => <RuleRow key={r.id} rule={r} />)}</div>
      }
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
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
  )
}

function RuleRow({ rule }: { rule: Rule }) {
  const router = useRouter()
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
      <button onClick={async () => { setIsDeleting(true); await deleteRule(rule.id); router.refresh() }} disabled={isDeleting} className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0">
        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
      </button>
    </div>
  )
}

// ─── FILA DE TRANSACCIÓN ──────────────────────────────────────────────────────

export function TransactionRow({ transaction: t, categories, isSelected = false, onToggleSelect, hideFlag = false }: {
  transaction: Transaction
  categories: Category[]
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  hideFlag?: boolean
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [concepto, setConcepto] = useState(t.concepto)
  const [categoria, setCategoria] = useState(t.categoria)
  const [subcategoria, setSubcategoria] = useState(t.subcategoria || '')
  const [createRuleEnabled, setCreateRuleEnabled] = useState(false)
  const [rulePattern, setRulePattern] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFlagging, setIsFlagging] = useState(false)
  const [flagged, setFlagged] = useState(t.needs_review ?? false)

  const handleToggleFlag = async () => {
    setIsFlagging(true)
    setFlagged(v => !v)
    await toggleNeedsReview(t.id, !flagged)
    router.refresh()
    setIsFlagging(false)
  }

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
    <div className={`transition-colors group ${isDeleting ? 'opacity-40' : ''} ${isSelected ? 'bg-blue-50/60' : ''} ${flagged && !isSelected ? 'bg-amber-50/40' : ''}`}>
      <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">

        {/* Checkbox selección */}
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(t.id)}
            className={`shrink-0 transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-200 hover:text-slate-400 opacity-0 group-hover:opacity-100'}`}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        )}

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
              {!hideFlag && (
                <button
                  onClick={handleToggleFlag}
                  disabled={isFlagging}
                  title={flagged ? 'Quitar de revisión' : 'Marcar para revisar'}
                  className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${flagged ? 'text-amber-500' : 'text-slate-200 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                >
                  {isFlagging ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                </button>
              )}
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

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────

function ActionButton({ icon, label, count, countColor = 'bg-blue-100 text-blue-600', onClick, disabled = false }: {
  icon: React.ReactNode; label: string; count?: number
  countColor?: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${countColor}`}>{count}</span>
      )}
    </button>
  )
}

// ─── CONTENIDO MODAL REVISIÓN ─────────────────────────────────────────────────

function ReviewPanelContent({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList size={32} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-400 text-sm">No hay movimientos pendientes de revisión en el mes actual.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 mb-4">
        Categoriza estos movimientos y pulsa <Flag size={10} className="inline text-amber-500" /> para quitarlos de la lista.
      </p>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {transactions.map(t => (
          <TransactionRow key={t.id} transaction={t} categories={categories} />
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

// ─── BARRA DE ACCIÓN MASIVA ───────────────────────────────────────────────────

function BulkActionBar({ count, categories, selectedIds, onClear, onDone }: {
  count: number
  categories: Category[]
  selectedIds: Set<string>
  onClear: () => void
  onDone: () => void
}) {
  const router = useRouter()
  const [categoria, setCategoria] = useState(categories[0]?.name ?? '')
  const [subcategoria, setSubcategoria] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const subcats = categories.find(c => c.name === categoria)?.transaction_subcategories ?? []

  const handleCatChange = (cat: string) => {
    setCategoria(cat)
    setSubcategoria('')
  }

  const handleApply = async () => {
    setIsApplying(true)
    const res = await bulkUpdateCategory([...selectedIds], categoria, subcategoria || null)
    router.refresh()
    setIsApplying(false)
    if ('error' in res && res.error) {
      setMsg(`Error: ${res.error}`)
    } else {
      setMsg(`${count} movimientos actualizados`)
      setTimeout(() => { setMsg(null); onDone() }, 2000)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-slate-900/30 flex-wrap">

        {/* Contador */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{count}</span>
          <span className="text-sm font-bold text-slate-300">seleccionados</span>
        </div>

        <div className="w-px h-5 bg-slate-700 shrink-0" />

        {/* Selectores */}
        <select
          value={categoria}
          onChange={e => handleCatChange(e.target.value)}
          className="text-sm font-bold bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer text-white"
        >
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        {subcats.length > 0 && (
          <select
            value={subcategoria}
            onChange={e => setSubcategoria(e.target.value)}
            className="text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer text-slate-300"
          >
            <option value="">Sin subcategoría</option>
            {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        )}

        {/* Aplicar */}
        <button
          onClick={handleApply}
          disabled={isApplying}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Aplicar
        </button>

        {/* Mensaje */}
        {msg && <span className="text-xs font-bold text-emerald-400">{msg}</span>}

        {/* Cerrar */}
        <button onClick={onClear} className="p-1.5 text-slate-400 hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
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

function ExportOptions({ transactions, onClose }: { transactions: Transaction[]; onClose: () => void }) {
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
    onClose()
  }

  const handleExcel = () => {
    const wb = XLSX.utils.book_new()

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
    onClose()
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{transactions.length} movimientos con el filtro actual.</p>
      <button
        onClick={handleCSV}
        className="flex items-center gap-4 w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
      >
        <FileText size={22} className="text-slate-400 shrink-0" />
        <div>
          <p className="font-bold text-slate-700 text-sm">CSV</p>
          <p className="text-xs text-slate-400">Datos en bruto del filtro actual</p>
        </div>
      </button>
      <button
        onClick={handleExcel}
        className="flex items-center gap-4 w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
      >
        <FileSpreadsheet size={22} className="text-emerald-500 shrink-0" />
        <div>
          <p className="font-bold text-slate-700 text-sm">Excel (.xlsx)</p>
          <p className="text-xs text-slate-400">Movimientos + desglose + evolución mensual</p>
        </div>
      </button>
    </div>
  )
}

