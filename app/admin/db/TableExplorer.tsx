'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, TriangleAlert, X, ArrowRight, Check } from 'lucide-react'
import { updateRow, deleteRow } from './actions'

type TableMeta = { name: string; label: string; module: string }
type Row = Record<string, unknown>

function groupByModule(tables: TableMeta[]) {
  const groups: Record<string, TableMeta[]> = {}
  for (const t of tables) {
    if (!groups[t.module]) groups[t.module] = []
    groups[t.module].push(t)
  }
  return groups
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-slate-300 italic text-xs">null</span>
  if (typeof value === 'boolean')
    return <span className={`text-xs font-bold ${value ? 'text-emerald-600' : 'text-red-400'}`}>{String(value)}</span>
  if (typeof value === 'object')
    return <span className="text-xs text-violet-500 font-mono">{JSON.stringify(value).slice(0, 50)}…</span>
  const str = String(value)
  return <span className="text-xs text-slate-700 font-mono">{str.length > 60 ? str.slice(0, 60) + '…' : str}</span>
}

// ── Modal de edición ────────────────────────────────────────────────────────

function EditModal({
  row,
  columns,
  tableName,
  onClose,
}: {
  row: Row
  columns: string[]
  tableName: string
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {}
    for (const col of columns) d[col] = displayValue(row[col])
    return d
  })
  const [confirmChanges, setConfirmChanges] = useState<{ col: string; from: string; to: string }[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const changedFields = columns
    .filter(col => col !== 'id' && draft[col] !== displayValue(row[col]))
    .map(col => ({ col, from: displayValue(row[col]), to: draft[col] }))

  const handleReview = () => {
    if (changedFields.length === 0) { onClose(); return }
    setConfirmChanges(changedFields)
  }

  const handleConfirm = () => {
    if (!confirmChanges) return
    startTransition(async () => {
      const payload: Record<string, unknown> = {}
      for (const { col, to } of confirmChanges) {
        const orig = row[col]
        if (to === '' || to === 'null') { payload[col] = null; continue }
        if (typeof orig === 'number') { payload[col] = Number(to); continue }
        if (typeof orig === 'boolean') { payload[col] = to === 'true'; continue }
        try { payload[col] = JSON.parse(to) } catch { payload[col] = to }
      }
      const res = await updateRow(tableName, String(row.id), payload)
      if (res?.error) { setError(res.error); setConfirmChanges(null) }
      else { onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-[480px] bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="font-black text-slate-900">Editar registro</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{tableName} · id: {String(row.id).slice(0, 12)}…</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Confirmation overlay */}
        {confirmChanges && (
          <div className="flex-1 flex flex-col">
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
              <TriangleAlert size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700">Revisa los cambios antes de confirmar</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {confirmChanges.map(({ col, from, to }) => (
                <div key={col} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{col}</p>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-red-400 font-bold mb-0.5">Antes</p>
                      <p className="text-xs font-mono text-red-700 break-all">{from || <span className="italic text-red-300">null</span>}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 shrink-0 mt-5" />
                    <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-emerald-500 font-bold mb-0.5">Después</p>
                      <p className="text-xs font-mono text-emerald-700 break-all">{to || <span className="italic text-emerald-300">null</span>}</p>
                    </div>
                  </div>
                </div>
              ))}
              {error && <p className="text-xs text-red-500 font-bold bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setConfirmChanges(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Volver a editar
              </button>
              <button onClick={handleConfirm} disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirmar cambios
              </button>
            </div>
          </div>
        )}

        {/* Edit form */}
        {!confirmChanges && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {columns.map(col => (
                <div key={col}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    {col}
                    {col === 'id' && <span className="ml-2 text-slate-300 normal-case font-normal">solo lectura</span>}
                  </label>
                  {col === 'id' ? (
                    <p className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                      {displayValue(row[col])}
                    </p>
                  ) : (
                    <textarea
                      value={draft[col]}
                      onChange={e => setDraft(d => ({ ...d, [col]: e.target.value }))}
                      rows={displayValue(row[col]).length > 60 ? 3 : 1}
                      className={`w-full text-xs font-mono border rounded-xl px-3 py-2.5 outline-none resize-y transition-colors ${
                        draft[col] !== displayValue(row[col])
                          ? 'border-amber-300 bg-amber-50/50 focus:border-amber-500'
                          : 'border-slate-200 bg-white focus:border-blue-400'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={handleReview}
                disabled={changedFields.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {changedFields.length > 0
                  ? `Revisar ${changedFields.length} cambio${changedFields.length > 1 ? 's' : ''}`
                  : 'Sin cambios'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Fila de tabla ───────────────────────────────────────────────────────────

function TableRow({ row, columns, tableName }: { row: Row; columns: string[]; tableName: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar esta fila? Esta acción no se puede deshacer.\n\nid: ${row.id}`)) return
    startDeleteTransition(async () => {
      await deleteRow(tableName, String(row.id))
    })
  }

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-blue-50/20 transition-colors group">
        {columns.map(col => (
          <td key={col} className="px-3 py-2.5 max-w-[200px] whitespace-nowrap overflow-hidden">
            <CellValue value={row[col]} />
          </td>
        ))}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors"
            >
              <Pencil size={11} /> Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </td>
      </tr>

      {editOpen && (
        <EditModal
          row={row}
          columns={columns}
          tableName={tableName}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  )
}

// ── Componente principal ────────────────────────────────────────────────────

export default function TableExplorer({
  tables, selectedTable, columns, rows, totalRows, page, totalPages, error,
}: {
  tables: TableMeta[]
  selectedTable: string
  columns: string[]
  rows: Row[]
  totalRows: number
  page: number
  totalPages: number
  error?: string
}) {
  const router = useRouter()
  const groups = groupByModule(tables)
  const selectedMeta = tables.find(t => t.name === selectedTable)

  const navigate = (table: string) => router.push(`/admin/db?table=${table}`)
  const goPage   = (p: number)      => router.push(`/admin/db?table=${selectedTable}&page=${p}`)

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tablas</p>
        </div>
        <nav className="p-2 space-y-4">
          {Object.entries(groups).map(([module, ts]) => (
            <div key={module}>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 mb-1">{module}</p>
              {ts.map(t => (
                <button key={t.name} onClick={() => navigate(t.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedTable === t.name ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-black text-slate-900">{selectedMeta?.label ?? selectedTable}</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedTable} · {totalRows} filas</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">Pág {page} / {Math.max(1, totalPages)}</span>
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 shrink-0">
          <TriangleAlert size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Los cambios se aplican directamente en producción. Siempre se pedirá confirmación antes de guardar.
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="p-8 text-center text-red-500">
              <p className="font-bold">Error al cargar la tabla</p>
              <p className="text-sm mt-1 font-mono">{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="font-bold">Tabla vacía</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <TableRow
                    key={String(row.id ?? i)}
                    row={row}
                    columns={columns}
                    tableName={selectedTable}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
