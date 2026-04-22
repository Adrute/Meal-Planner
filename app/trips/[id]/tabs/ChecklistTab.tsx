'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, CheckSquare, Sparkles } from 'lucide-react'
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, prefillChecklist } from '../../actions'
import type { Trip, ChecklistItem } from '../TripDetail'

const CATEGORIES = [
  { value: 'documentos',  label: '📄 Documentos' },
  { value: 'ropa',        label: '👕 Ropa' },
  { value: 'higiene',     label: '🧴 Higiene' },
  { value: 'tecnología',  label: '📱 Tecnología' },
  { value: 'salud',       label: '💊 Salud' },
  { value: 'accesorios',  label: '🎒 Accesorios' },
  { value: 'otro',        label: '📦 Otro' },
]

export default function ChecklistTab({ trip, checklist }: { trip: Trip; checklist: ChecklistItem[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [item, setItem]       = useState('')
  const [category, setCat]    = useState('otro')
  const [saving, setSaving]   = useState(false)
  const [prefilling, setPref] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const checked = checklist.filter(i => i.checked).length
  const total   = checklist.length
  const pct     = total > 0 ? (checked / total) * 100 : 0

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: checklist.filter(i => i.category === cat.value),
  })).filter(c => c.items.length > 0)

  const uncategorized = checklist.filter(i => !CATEGORIES.map(c => c.value).includes(i.category))
  if (uncategorized.length > 0) grouped.push({ value: 'otro', label: '📦 Otro', items: uncategorized })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) { setError('El nombre del item es obligatorio'); return }
    setSaving(true); setError(null)
    const res = await addChecklistItem(trip.id, item.trim(), category)
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    setItem('')
    startTransition(() => router.refresh())
  }

  const handleToggle = async (id: string, checked: boolean) => {
    setTogglingId(id)
    await toggleChecklistItem(id, !checked, trip.id)
    setTogglingId(null)
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteChecklistItem(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const handlePrefill = async () => {
    if (!confirm('¿Añadir items comunes de viaje a la lista?')) return
    setPref(true)
    await prefillChecklist(trip.id)
    setPref(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      {total > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Progreso</p>
            <p className="text-sm font-black text-slate-700">{checked}/{total}</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 100 && <p className="text-xs text-emerald-600 font-bold">✓ Todo listo para el viaje</p>}
        </div>
      )}

      {checklist.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Checklist vacía</p>
          <p className="text-sm mt-1">Añade items o usa los comunes</p>
          <button onClick={handlePrefill} disabled={prefilling}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
            {prefilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Rellenar con items comunes
          </button>
        </div>
      )}

      {/* Grouped list */}
      {grouped.map(group => (
        <div key={group.value} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-5 py-3 border-b border-slate-100">
            {group.label}
          </p>
          <div className="divide-y divide-slate-50">
            {group.items.map(i => (
              <div key={i.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 group transition-colors">
                <button onClick={() => handleToggle(i.id, i.checked)} disabled={togglingId === i.id}
                  className="shrink-0 text-slate-300 hover:text-violet-500 transition-colors">
                  {togglingId === i.id
                    ? <Loader2 size={18} className="animate-spin" />
                    : i.checked
                      ? <CheckSquare size={18} className="text-emerald-500" />
                      : <CheckSquare size={18} className="text-slate-200" />
                  }
                </button>
                <span className={`flex-1 text-sm font-medium ${i.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {i.item}
                </span>
                <button onClick={() => handleDelete(i.id)} disabled={deletingId === i.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0">
                  {deletingId === i.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <input value={item} onChange={e => setItem(e.target.value)} placeholder="Añadir item..."
            className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <select value={category} onChange={e => setCat(e.target.value)}
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? 'Añadiendo...' : 'Añadir'}
          </button>
          {checklist.length > 0 && (
            <button type="button" onClick={handlePrefill} disabled={prefilling}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
              {prefilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Comunes
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
