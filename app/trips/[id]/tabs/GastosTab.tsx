'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Receipt } from 'lucide-react'
import { addExpense, deleteExpense } from '../../actions'
import type { Trip, Expense } from '../TripDetail'

const CATEGORIES = [
  { value: 'comida',       label: '🍽️ Comida' },
  { value: 'transporte',   label: '🚌 Transporte' },
  { value: 'alojamiento',  label: '🏨 Alojamiento' },
  { value: 'actividades',  label: '🎭 Actividades' },
  { value: 'compras',      label: '🛍️ Compras' },
  { value: 'salud',        label: '🏥 Salud' },
  { value: 'otro',         label: '💡 Otro' },
]

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function GastosTab({ trip, expenses }: { trip: Trip; expenses: Expense[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [description, setDesc] = useState('')
  const [amount, setAmount]    = useState('')
  const [category, setCat]     = useState('otro')
  const [date, setDate]        = useState('')
  const [notes, setNotes]      = useState('')

  const resetForm = () => {
    setDesc(''); setAmount(''); setCat('otro'); setDate(''); setNotes('')
    setShowForm(false); setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount) { setError('Descripción e importe son obligatorios'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Importe inválido'); return }
    setSaving(true); setError(null)
    const res = await addExpense(trip.id, {
      description, amount: amt, category,
      date: date || undefined, notes: notes || undefined,
    })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    resetForm()
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteExpense(id, trip.id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const budgetNum = trip.budget_total ?? 0
  const pct = budgetNum > 0 ? Math.min((total / budgetNum) * 100, 100) : 0

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total gastado</p>
              <p className="text-3xl font-black text-slate-900">{total.toFixed(2)} €</p>
            </div>
            {budgetNum > 0 && (
              <p className="text-sm text-slate-400">de {budgetNum.toFixed(0)} € presupuestados</p>
            )}
          </div>
          {budgetNum > 0 && (
            <div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
          {byCategory.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {byCategory.map(c => (
                <div key={c.value} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                  <p className="font-black text-slate-800">{c.total.toFixed(0)} €</p>
                  <p className="text-[10px] text-slate-400">{total > 0 ? ((c.total / total) * 100).toFixed(0) : 0}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expenses.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <Receipt size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">Sin gastos registrados</p>
          <p className="text-sm mt-1">Lleva el control de lo que gastas</p>
        </div>
      )}

      {/* Expense list */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map(e => {
            const cat = CATEGORIES.find(c => c.value === e.category)
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 group">
                <span className="text-xl shrink-0">{cat?.label.split(' ')[0] ?? '💡'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{e.description}</p>
                  <p className="text-xs text-slate-400">
                    {cat?.label.split(' ').slice(1).join(' ')}
                    {e.date ? ` · ${fmtDate(e.date)}` : ''}
                  </p>
                  {e.notes && <p className="text-xs text-slate-400 italic">{e.notes}</p>}
                </div>
                <span className="font-black text-rose-600 shrink-0">{e.amount.toFixed(2)} €</span>
                <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0">
                  {deletingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nuevo gasto</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Descripción *"
              className="col-span-2 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Importe (€) *" min="0" step="0.01"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
            <select value={category} onChange={e => setCat(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas"
              className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Guardando...' : 'Añadir gasto'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-bold transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-500 font-bold py-4 rounded-2xl text-sm transition-colors">
          <Plus size={16} /> Añadir gasto
        </button>
      )}
    </div>
  )
}
