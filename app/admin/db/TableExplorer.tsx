'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, Loader2, ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import { updateRow, deleteRow } from './actions'

type TableMeta = { name: string; label: string; module: string }

function groupByModule(tables: TableMeta[]) {
  const groups: Record<string, TableMeta[]> = {}
  for (const t of tables) {
    if (!groups[t.module]) groups[t.module] = []
    groups[t.module].push(t)
  }
  return groups
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-slate-300 italic text-xs">null</span>
  if (typeof value === 'boolean') return <span className={`text-xs font-bold ${value ? 'text-emerald-600' : 'text-red-400'}`}>{String(value)}</span>
  if (typeof value === 'object') return <span className="text-xs text-slate-400 font-mono">{JSON.stringify(value).slice(0, 60)}</span>
  const str = String(value)
  return <span className="text-xs text-slate-700">{str.length > 80 ? str.slice(0, 80) + '…' : str}</span>
}

function EditableRow({
  row,
  columns,
  tableName,
}: {
  row: Record<string, unknown>
  columns: string[]
  tableName: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const startEdit = () => {
    const d: Record<string, string> = {}
    for (const col of columns) {
      const v = row[col]
      d[col] = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    }
    setDraft(d)
    setEditing(true)
    setError(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const payload: Record<string, unknown> = {}
      for (const col of columns) {
        if (col === 'id') continue
        const orig = row[col]
        const val = draft[col]
        if (val === '' || val === 'null') { payload[col] = null; continue }
        if (typeof orig === 'number') { payload[col] = Number(val); continue }
        if (typeof orig === 'boolean') { payload[col] = val === 'true'; continue }
        try { payload[col] = JSON.parse(val) } catch { payload[col] = val }
      }
      const res = await updateRow(tableName, String(row.id), payload)
      if (res?.error) { setError(res.error) } else { setEditing(false) }
    })
  }

  const handleDelete = () => {
    if (!confirm('¿Eliminar esta fila? No se puede deshacer.')) return
    startDeleteTransition(async () => {
      await deleteRow(tableName, String(row.id))
    })
  }

  return (
    <>
      <tr className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${editing ? 'bg-amber-50/40' : ''}`}>
        {columns.map(col => (
          <td key={col} className="px-3 py-2 max-w-[200px]">
            {editing && col !== 'id' ? (
              <input
                value={draft[col] ?? ''}
                onChange={e => setDraft(d => ({ ...d, [col]: e.target.value }))}
                className="w-full text-xs border border-amber-300 rounded-lg px-2 py-1 outline-none focus:border-amber-500 bg-white font-mono"
              />
            ) : (
              <CellValue value={row[col]} />
            )}
          </td>
        ))}
        <td className="px-3 py-2 shrink-0">
          <div className="flex items-center gap-1 justify-end">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={isPending}
                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button onClick={() => setEditing(false)}
                  className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </>
            )}
          </div>
          {error && <p className="text-[10px] text-red-500 mt-1 text-right">{error}</p>}
        </td>
      </tr>
    </>
  )
}

export default function TableExplorer({
  tables, selectedTable, columns, rows, totalRows, page, totalPages, error,
}: {
  tables: TableMeta[]
  selectedTable: string
  columns: string[]
  rows: Record<string, unknown>[]
  totalRows: number
  page: number
  totalPages: number
  error?: string
}) {
  const router = useRouter()
  const groups = groupByModule(tables)

  const navigate = (table: string) => router.push(`/admin/db?table=${table}`)
  const goPage = (p: number) => router.push(`/admin/db?table=${selectedTable}&page=${p}`)

  const selectedMeta = tables.find(t => t.name === selectedTable)

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
                <button
                  key={t.name}
                  onClick={() => navigate(t.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedTable === t.name
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
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
            <p className="text-xs text-slate-400 font-mono">{selectedTable} · {totalRows} filas</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">Pág {page} / {totalPages || 1}</span>
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 shrink-0">
          <TriangleAlert size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Los cambios se aplican directamente en producción sin confirmación adicional.</p>
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
                  <EditableRow
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
