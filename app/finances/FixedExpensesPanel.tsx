'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  toggleFixedExpenseActive,
} from './actions'

export type FixedExpense = {
  id: string
  name: string
  amount: number
  period: string
  category: string | null
  active: boolean
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  biannual: 'Semestral',
  annual: 'Anual',
}

const PERIODS = Object.keys(PERIOD_LABELS)

type FormState = {
  name: string
  amount: string
  period: string
  category: string
}

const EMPTY_FORM: FormState = { name: '', amount: '', period: 'monthly', category: '' }

export default function FixedExpensesPanel({ fixedExpenses }: { fixedExpenses: FixedExpense[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [items, setItems] = useState(fixedExpenses)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { setItems(fixedExpenses) }, [fixedExpenses])

  const refresh = () => startTransition(() => router.refresh())

  const totalActive = items.filter(e => e.active).reduce((s, e) => s + e.amount, 0)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return

    const data = {
      name: form.name.trim(),
      amount,
      period: form.period,
      category: form.category.trim(),
    }

    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? { ...item, ...data } : item))
      await updateFixedExpense(editingId, data)
    } else {
      const optimistic: FixedExpense = { id: 'tmp-' + Date.now(), active: true, ...data, category: data.category || null }
      setItems(prev => [...prev, optimistic])
      await createFixedExpense(data)
    }

    resetForm()
    refresh()
  }

  const handleEdit = (item: FixedExpense) => {
    setForm({
      name: item.name,
      amount: String(item.amount),
      period: item.period,
      category: item.category ?? '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    await deleteFixedExpense(id)
    refresh()
  }

  const handleToggle = async (id: string, active: boolean) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, active } : item))
    await toggleFixedExpenseActive(id, active)
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Gastos fijos mensuales</p>
        <button
          onClick={() => { setShowForm(s => !s); setEditingId(null); setForm(EMPTY_FORM) }}
          className="text-xs font-bold text-teal-600 hover:text-teal-700"
        >
          {showForm && !editingId ? 'Cancelar' : '+ Añadir'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">

        {/* Formulario de alta / edición */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                className="col-span-2 sm:col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Nombre (ej: Seguro hogar)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="€/mes"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              >
                {PERIODS.map(p => (
                  <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                ))}
              </select>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Categoría (opcional)"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600">
                {editingId ? 'Guardar cambios' : 'Añadir gasto fijo'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        {items.length === 0 ? (
          <p className="text-sm text-slate-300 text-center py-4">Sin gastos fijos registrados</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${item.active ? 'bg-slate-50' : 'bg-slate-50/40 opacity-50'}`}
              >
                <button
                  onClick={() => handleToggle(item.id, !item.active)}
                  title={item.active ? 'Desactivar' : 'Activar'}
                  className={`w-4 h-4 rounded-full border-2 shrink-0 ${item.active ? 'bg-teal-400 border-teal-400' : 'border-slate-300'}`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                  {item.category && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.category}</span>
                  )}
                  <span className="ml-2 text-[10px] text-slate-300">{PERIOD_LABELS[item.period] ?? item.period}</span>
                </div>
                <span className="text-sm font-black text-slate-800 shrink-0">{item.amount.toFixed(2)} €/mes</span>
                <button
                  onClick={() => handleEdit(item)}
                  className="text-xs text-slate-400 hover:text-teal-500 font-bold shrink-0"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-slate-300 hover:text-red-500 font-bold shrink-0"
                >
                  Borrar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Total y fondo de emergencia */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total fijos activos</span>
            <span className="text-xl font-black text-slate-900">{totalActive.toFixed(2)} €/mes</span>
          </div>

          {totalActive > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {([3, 6, 12] as const).map(months => (
                <div key={months} className="rounded-xl border border-slate-100 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Fondo {months}m
                  </p>
                  <p className="text-base font-black text-slate-800">
                    {(totalActive * months).toFixed(0)} €
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
