'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  toggleFixedExpenseActive,
} from './actions'
import { Home, Plus, Pencil, Trash2, Sparkles, Check } from 'lucide-react'

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
      {/* Cabecera de sección */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Home size={14} className="text-teal-500 shrink-0" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Gastos Fijos</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setEditingId(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} />
          Añadir
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Formulario de alta / edición */}
        {showForm && (
          <div className="border-b border-emerald-100 bg-emerald-50/60 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">
              {editingId ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white"
                  placeholder="Nombre (ej: Seguro hogar)"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-14 text-sm outline-none focus:border-emerald-400 bg-white"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">€/mes</span>
                </div>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white text-slate-600"
                  value={form.period}
                  onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                >
                  {PERIODS.map(p => (
                    <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                  ))}
                </select>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white"
                  placeholder="Categoría (ej: Hogar, Seguros…)"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <Check size={14} />
                  {editingId ? 'Guardar cambios' : 'Añadir gasto fijo'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {items.length === 0 ? (
          <div className="text-center py-14 px-6">
            <Sparkles size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="font-bold text-slate-400 text-sm">Sin gastos fijos registrados</p>
            <p className="text-xs text-slate-300 mt-1">Añade los recibos que pagas cada mes para calcular tu fondo de emergencia</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-slate-50/60 ${!item.active ? 'opacity-50' : ''}`}
              >
                {/* Toggle activo/inactivo */}
                <button
                  onClick={() => handleToggle(item.id, !item.active)}
                  title={item.active ? 'Desactivar' : 'Activar'}
                  className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                    item.active
                      ? 'bg-teal-400 border-teal-400'
                      : 'border-slate-300 bg-white hover:border-teal-300'
                  }`}
                />

                {/* Nombre y meta */}
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold truncate ${item.active ? 'text-slate-700' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                      {item.category}
                    </span>
                  )}
                  {item.period !== 'monthly' && (
                    <span className="text-[10px] font-bold text-slate-300 shrink-0">
                      {PERIOD_LABELS[item.period] ?? item.period}
                    </span>
                  )}
                </div>

                {/* Importe */}
                <span className={`text-sm font-black shrink-0 ${item.active ? 'text-teal-600' : 'text-slate-400'}`}>
                  {item.amount.toFixed(2)} €<span className="text-[10px] font-bold text-slate-300">/mes</span>
                </span>

                {/* Acciones hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen y fondo de emergencia */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-5 space-y-4">
            {/* Total mensual */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total fijos activos</p>
                <p className="text-xs text-slate-300 mt-0.5">Compromisos mensuales en vigor</p>
              </div>
              <span className="text-2xl font-black text-teal-600">{totalActive.toFixed(2)} €<span className="text-sm font-bold text-slate-400">/mes</span></span>
            </div>

            {/* Fondo de emergencia */}
            {totalActive > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Fondo de emergencia recomendado</p>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 6, 12] as const).map(months => (
                    <div
                      key={months}
                      className={`rounded-xl border p-3 text-center relative ${
                        months === 6
                          ? 'border-teal-200 bg-teal-50'
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      {months === 6 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest bg-teal-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                          Recomendado
                        </span>
                      )}
                      <p className={`text-base font-black mt-1 ${months === 6 ? 'text-teal-700' : 'text-slate-800'}`}>
                        {(totalActive * months).toFixed(0)} €
                      </p>
                      <p className={`text-[10px] font-bold mt-0.5 ${months === 6 ? 'text-teal-500' : 'text-slate-400'}`}>
                        {months} meses
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
