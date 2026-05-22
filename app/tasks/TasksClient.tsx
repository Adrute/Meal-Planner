'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare, Square, Plus, Pencil, Trash2, Loader2, X, Check,
  CalendarClock, RotateCcw, Clock, Sparkles,
} from 'lucide-react'
import { createTask, updateTask, deleteTask, completeTask, uncompleteTask } from './actions'

type Task = {
  id: string; title: string; frequency: string
  day_of_week: string | null; assigned_to: string | null; notes: string | null
}
type Completion = { id: string; task_id: string; completed_date: string; completed_by: string | null }
type Profile = { id: string; display_name: string | null; email: string }

const FREQ_CONFIG: Record<string, { label: string; period: string; bg: string; text: string; border: string }> = {
  daily:    { label: 'Diaria',   period: 'today', bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200'    },
  weekly:   { label: 'Semanal',  period: 'week',  bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  annual:   { label: 'Anual',    period: 'year',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  punctual: { label: 'Puntual',  period: 'all',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200'   },
}

const DAYS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
const DAY_LABEL: Record<string, string> = {
  lunes:'Lun', martes:'Mar', miércoles:'Mié', jueves:'Jue', viernes:'Vie', sábado:'Sáb', domingo:'Dom'
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now); monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  return {
    monday: monday.toISOString().split('T')[0],
    sunday:  sunday.toISOString().split('T')[0],
  }
}

function isDone(task: Task, completions: Completion[]): boolean {
  const today = new Date().toISOString().split('T')[0]
  const year  = new Date().getFullYear()
  const { monday, sunday } = getWeekRange()
  const tc = completions.filter(c => c.task_id === task.id)

  if (task.frequency === 'daily')    return tc.some(c => c.completed_date === today)
  if (task.frequency === 'weekly')   return tc.some(c => c.completed_date >= monday && c.completed_date <= sunday)
  if (task.frequency === 'annual')   return tc.some(c => c.completed_date.startsWith(String(year)))
  if (task.frequency === 'punctual') return tc.length > 0
  return false
}

function lastDone(task: Task, completions: Completion[]): string | null {
  const tc = completions.filter(c => c.task_id === task.id).sort((a, b) => b.completed_date.localeCompare(a.completed_date))
  if (!tc.length) return null
  return tc[0].completed_date
}

// ── Task form ─────────────────────────────────────────────────────────────────

function TaskForm({
  initial, profiles, onSave, onCancel,
}: {
  initial?: Task | null
  profiles: Profile[]
  onSave: (data: Omit<Task, 'id'>) => Promise<void>
  onCancel: () => void
}) {
  const [title,      setTitle]     = useState(initial?.title ?? '')
  const [frequency,  setFrequency] = useState(initial?.frequency ?? 'weekly')
  const [dayOfWeek,  setDayOfWeek] = useState(initial?.day_of_week ?? '')
  const [assignedTo, setAssigned]  = useState(initial?.assigned_to ?? '')
  const [notes,      setNotes]     = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), frequency, day_of_week: dayOfWeek || null, assigned_to: assignedTo || null, notes: notes || null })
    setSaving(false)
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-300 bg-white'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-violet-200 p-5 space-y-3 shadow-sm">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{initial ? 'Editar tarea' : 'Nueva tarea'}</p>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la tarea *"
        className={inputCls} autoFocus required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Frecuencia</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputCls}>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="annual">Anual</option>
            <option value="punctual">Puntual</option>
          </select>
        </div>
        {frequency === 'weekly' && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Día</label>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className={inputCls}>
              <option value="">Sin día fijo</option>
              {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asignada a</label>
        <select value={assignedTo} onChange={e => setAssigned(e.target.value)} className={inputCls}>
          <option value="">Sin asignar</option>
          {profiles.map(p => (
            <option key={p.id} value={p.display_name ?? p.email}>{p.display_name ?? p.email}</option>
          ))}
        </select>
      </div>

      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)"
        className={inputCls} />

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {initial ? 'Guardar cambios' : 'Crear tarea'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Task card (pending view) ───────────────────────────────────────────────────

function TaskCard({
  task, done, last, currentUser, onToggle,
}: {
  task: Task; done: boolean; last: string | null; currentUser: string; onToggle: () => void
}) {
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${done ? 'bg-slate-50/60 border-slate-100 opacity-70' : `${freq.bg} ${freq.border}`}`}>
      <button onClick={onToggle} className="shrink-0">
        {done
          ? <CheckSquare size={22} className="text-emerald-500" />
          : <Square size={22} className="text-slate-300" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.assigned_to && (
            <span className="text-[10px] font-bold text-slate-400">{task.assigned_to}</span>
          )}
          {task.day_of_week && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${freq.bg} ${freq.text}`}>
              {DAY_LABEL[task.day_of_week] ?? task.day_of_week}
            </span>
          )}
          {last && done && (
            <span className="text-[10px] text-emerald-600 font-medium">
              ✓ {new Date(last + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TasksClient({
  tasks, completions, profiles, currentUser,
}: {
  tasks: Task[]; completions: Completion[]; profiles: Profile[]; currentUser: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [view, setView] = useState<'pending' | 'all'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCompletions, setLocalCompletions] = useState<Completion[]>(completions)

  const refresh = () => startTransition(() => router.refresh())

  const displayName = profiles.find(p => p.email === currentUser)?.display_name ?? currentUser.split('@')[0]

  const handleToggle = async (task: Task) => {
    setTogglingId(task.id)
    const done = isDone(task, localCompletions)
    const period = FREQ_CONFIG[task.frequency]?.period ?? 'all'

    if (done) {
      // Optimistic remove
      setLocalCompletions(prev => prev.filter(c => {
        if (c.task_id !== task.id) return true
        const today = new Date().toISOString().split('T')[0]
        const year = new Date().getFullYear()
        const { monday, sunday } = getWeekRange()
        if (period === 'today')  return c.completed_date !== today
        if (period === 'week')   return !(c.completed_date >= monday && c.completed_date <= sunday)
        if (period === 'year')   return !c.completed_date.startsWith(String(year))
        return false
      }))
      await uncompleteTask(task.id, period)
    } else {
      // Optimistic add
      const fake: Completion = { id: 'tmp', task_id: task.id, completed_date: new Date().toISOString().split('T')[0], completed_by: displayName }
      setLocalCompletions(prev => [...prev, fake])
      await completeTask(task.id, displayName)
    }
    setTogglingId(null)
    refresh()
  }

  const handleSave = async (data: Omit<Task, 'id'>) => {
    const payload = {
      title: data.title,
      frequency: data.frequency,
      day_of_week: data.day_of_week ?? undefined,
      assigned_to: data.assigned_to ?? undefined,
      notes: data.notes ?? undefined,
    }
    if (editing) {
      await updateTask(editing.id, payload)
      setEditing(null)
    } else {
      await createTask(payload)
      setShowForm(false)
    }
    refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    setDeletingId(id)
    await deleteTask(id)
    setDeletingId(null)
    refresh()
  }

  const totalPending = tasks.filter(t => !isDone(t, localCompletions)).length
  const totalDone    = tasks.filter(t =>  isDone(t, localCompletions)).length

  // Group by frequency for "all" view
  const byFreq: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (!byFreq[t.frequency]) byFreq[t.frequency] = []
    byFreq[t.frequency].push(t)
  }
  const freqOrder = ['daily', 'weekly', 'annual', 'punctual']

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 animate-in fade-in">

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tareas del hogar</h1>
          <p className="text-slate-400 font-medium mt-1 text-sm">
            {totalDone} completadas · {totalPending} pendientes
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null) }}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Añadir tarea
        </button>
      </header>

      {/* New task form */}
      {(showForm && !editing) && (
        <div className="mb-6">
          <TaskForm profiles={profiles} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(['pending', 'all'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {v === 'pending' ? '📋 Esta semana' : '⚙️ Gestionar'}
          </button>
        ))}
      </div>

      {/* Pending view */}
      {view === 'pending' && (
        <div className="space-y-6">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Sparkles size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">Sin tareas registradas</p>
              <p className="text-sm mt-1">Añade tareas con el botón de arriba</p>
            </div>
          )}

          {freqOrder.filter(f => byFreq[f]?.length).map(freq => {
            const cfg = FREQ_CONFIG[freq]
            const freqTasks = byFreq[freq] ?? []
            return (
              <div key={freq}>
                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cfg.text}`}>{cfg.label}s</p>
                <div className="space-y-2">
                  {freqTasks.map(task => (
                    <div key={task.id} className="relative">
                      {togglingId === task.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 size={16} className="animate-spin text-violet-500" />
                        </div>
                      )}
                      <TaskCard
                        task={task}
                        done={isDone(task, localCompletions)}
                        last={lastDone(task, localCompletions)}
                        currentUser={currentUser}
                        onToggle={() => handleToggle(task)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* All tasks view */}
      {view === 'all' && (
        <div className="space-y-6">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="font-bold">Sin tareas. Añade la primera.</p>
            </div>
          )}

          {freqOrder.filter(f => byFreq[f]?.length).map(freq => {
            const cfg = FREQ_CONFIG[freq]
            return (
              <div key={freq}>
                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cfg.text}`}>{cfg.label}s</p>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  {(byFreq[freq] ?? []).map(task => (
                    <div key={task.id}>
                      {editing?.id === task.id ? (
                        <div className="p-3">
                          <TaskForm initial={task} profiles={profiles} onSave={handleSave} onCancel={() => setEditing(null)} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 group">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.bg} border ${cfg.border}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800">{task.title}</p>
                            <p className="text-xs text-slate-400">
                              {task.assigned_to && <span>{task.assigned_to}</span>}
                              {task.day_of_week && <span> · {task.day_of_week.charAt(0).toUpperCase() + task.day_of_week.slice(1)}</span>}
                              {task.notes && <span> · {task.notes}</span>}
                              {lastDone(task, localCompletions) && (
                                <span className="text-emerald-600"> · Última vez: {new Date(lastDone(task, localCompletions)! + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditing(task); setShowForm(false) }}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(task.id)} disabled={deletingId === task.id}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                              {deletingId === task.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
