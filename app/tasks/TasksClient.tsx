'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare, Square, Plus, Pencil, Trash2, Loader2, X, Check,
  CalendarClock, RotateCcw, Clock, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createTask, updateTask, deleteTask, completeTask, uncompleteTask } from './actions'

type Task = {
  id: string; title: string; frequency: string
  day_of_week: string | null; assigned_to: string | null; notes: string | null
}
type Completion = { id: string; task_id: string; completed_date: string; completed_by: string | null }
type Profile = { id: string; display_name: string | null; email: string }

const FREQ_CONFIG: Record<string, { label: string; plural: string; period: string; bg: string; text: string; border: string; dot: string }> = {
  daily:    { label: 'Diaria',    plural: 'Diarias',    period: 'today', bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200',    dot: 'bg-sky-400'    },
  weekly:   { label: 'Semanal',   plural: 'Semanales',  period: 'week',  bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  annual:   { label: 'Anual',     plural: 'Anuales',    period: 'year',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  punctual: { label: 'Puntual',   plural: 'Puntuales',  period: 'all',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-400'   },
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
  task, done, last, profiles, onUncomplete, onComplete,
}: {
  task: Task; done: boolean; last: string | null
  profiles: Profile[]; onUncomplete: () => void; onComplete: (person: string) => void
}) {
  const [picking, setPicking] = useState(false)
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual

  const handleClick = () => {
    if (done) { onUncomplete() } else { setPicking(true) }
  }

  return (
    <div className={`flex flex-col p-4 rounded-2xl border transition-all ${done ? 'bg-slate-50/60 border-slate-100 opacity-70' : `${freq.bg} ${freq.border}`}`}>
      <div className="flex items-center gap-3">
        <button onClick={handleClick} className="shrink-0">
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

      {picking && (
        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">¿Quién lo ha hecho?</p>
          <div className="flex flex-wrap gap-1.5">
            {profiles.map(p => {
              const name = p.display_name ?? p.email.split('@')[0]
              return (
                <button key={p.id}
                  onClick={() => { setPicking(false); onComplete(name) }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${freq.bg} ${freq.text} ${freq.border} hover:opacity-70`}>
                  {name}
                </button>
              )
            })}
            <button onClick={() => setPicking(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Calendar view ─────────────────────────────────────────────────────────────

const DOW_ABBR = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function CalendarView({ tasks, completions }: { tasks: Task[]; completions: Completion[] }) {
  const [mode, setMode]   = useState<'week' | 'month'>('week')
  const [offset, setOffset] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const byDate: Record<string, Completion[]> = {}
  for (const c of completions) {
    if (!byDate[c.completed_date]) byDate[c.completed_date] = []
    byDate[c.completed_date].push(c)
  }

  const now = new Date()
  const todayDow = now.getDay() || 7
  const monBase  = new Date(now)
  monBase.setDate(now.getDate() - todayDow + 1 + offset * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monBase)
    d.setDate(monBase.getDate() + i)
    return d
  })

  const refDate     = new Date(now.getFullYear(), now.getMonth() + (mode === 'month' ? offset : 0), 1)
  const yr          = refDate.getFullYear()
  const mo          = refDate.getMonth()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const firstDow    = (new Date(yr, mo, 1).getDay() + 6) % 7

  const fmtDate   = (d: Date) => d.toISOString().split('T')[0]
  const monthName = refDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const weekLabel = `${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['week', 'month'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setOffset(0) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {m === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setOffset(o => o - 1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[190px] text-center capitalize">
            {mode === 'week' ? weekLabel : monthName}
          </span>
          <button onClick={() => setOffset(o => o + 1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronRight size={18} />
          </button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)}
              className="ml-1 text-xs font-bold text-violet-500 hover:bg-violet-50 px-2.5 py-1 rounded-lg transition-colors">
              Hoy
            </button>
          )}
        </div>
      </div>

      {mode === 'week' && (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map(d => {
            const ds = fmtDate(d)
            const dc = byDate[ds] ?? []
            const isToday = ds === today
            return (
              <div key={ds} className={`rounded-2xl p-2.5 border flex flex-col min-h-[130px] ${isToday ? 'bg-lime-50 border-lime-200' : 'bg-white border-slate-100'}`}>
                <div className="mb-2">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-lime-600' : 'text-slate-400'}`}>
                    {d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}
                  </p>
                  <p className={`text-xl font-black leading-none ${isToday ? 'text-lime-700' : 'text-slate-700'}`}>
                    {d.getDate()}
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {dc.length === 0
                    ? <p className="text-[10px] text-slate-200 mt-1">—</p>
                    : dc.map(c => {
                        const task = tasks.find(t => t.id === c.task_id)
                        if (!task) return null
                        const cfg = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
                        return (
                          <div key={c.id} title={task.title}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text} leading-tight truncate`}>
                            {task.title}
                          </div>
                        )
                      })
                  }
                </div>
                {dc.length > 0 && (
                  <p className={`text-[9px] font-bold mt-1 pt-1 border-t ${isToday ? 'border-lime-200 text-lime-600' : 'border-slate-100 text-slate-400'}`}>
                    {dc.length} ✓
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {mode === 'month' && (
        <div>
          <div className="grid grid-cols-7 mb-2">
            {DOW_ABBR.map(a => (
              <div key={a} className="text-[10px] font-black text-slate-400 text-center py-1.5">{a}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const ds  = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dc  = byDate[ds] ?? []
              const isToday = ds === today
              return (
                <div key={day} className={`rounded-xl p-1 flex flex-col items-center border min-h-[48px] ${
                  isToday ? 'bg-lime-50 border-lime-200' :
                  dc.length > 0 ? 'bg-white border-slate-100' :
                  'border-transparent bg-white'
                }`}>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black mb-0.5 ${
                    isToday ? 'bg-lime-400 text-white' : 'text-slate-600'
                  }`}>
                    {day}
                  </div>
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dc.slice(0, 3).map((c, ci) => {
                      const task = tasks.find(t => t.id === c.task_id)
                      const cfg  = task ? (FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual) : FREQ_CONFIG.punctual
                      return <div key={ci} title={task?.title} className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    })}
                    {dc.length > 3 && (
                      <span className="text-[8px] font-black text-slate-300">+{dc.length - 3}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-100">
            {Object.entries(FREQ_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-bold text-slate-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [view, setView] = useState<'pending' | 'all' | 'calendar'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCompletions, setLocalCompletions] = useState<Completion[]>(completions)

  const refresh = () => startTransition(() => router.refresh())

  const handleUncomplete = async (task: Task) => {
    setTogglingId(task.id)
    const period = FREQ_CONFIG[task.frequency]?.period ?? 'all'
    setLocalCompletions(prev => prev.filter(c => {
      if (c.task_id !== task.id) return true
      const today = new Date().toISOString().split('T')[0]
      const year  = new Date().getFullYear()
      const { monday, sunday } = getWeekRange()
      if (period === 'today') return c.completed_date !== today
      if (period === 'week')  return !(c.completed_date >= monday && c.completed_date <= sunday)
      if (period === 'year')  return !c.completed_date.startsWith(String(year))
      return false
    }))
    await uncompleteTask(task.id, period)
    setTogglingId(null)
    refresh()
  }

  const handleComplete = async (task: Task, person: string) => {
    setTogglingId(task.id)
    const fake: Completion = { id: 'tmp', task_id: task.id, completed_date: new Date().toISOString().split('T')[0], completed_by: person }
    setLocalCompletions(prev => [...prev, fake])
    await completeTask(task.id, person)
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
        {([
          ['pending',  '📋 Esta semana'],
          ['all',      '⚙️ Gestionar'],
          ['calendar', '📅 Historial'],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {label}
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
            const freqTasks = (byFreq[freq] ?? []).slice().sort((a, b) =>
              freq === 'weekly' ? DAYS.indexOf(a.day_of_week ?? '') - DAYS.indexOf(b.day_of_week ?? '') : 0
            )
            const doneCnt = freqTasks.filter(t => isDone(t, localCompletions)).length
            const pct = freqTasks.length > 0 ? Math.round((doneCnt / freqTasks.length) * 100) : 0
            return (
              <div key={freq}>
                <div className="flex items-center gap-3 mb-3">
                  <p className={`text-xs font-black uppercase tracking-widest shrink-0 ${cfg.text}`}>{cfg.plural}</p>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cfg.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{doneCnt}/{freqTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {freqTasks.map(task => (
                    <div key={task.id} className="relative">
                      {togglingId === task.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 rounded-2xl">
                          <Loader2 size={16} className="animate-spin text-violet-500" />
                        </div>
                      )}
                      <TaskCard
                        task={task}
                        done={isDone(task, localCompletions)}
                        last={lastDone(task, localCompletions)}
                        profiles={profiles}
                        onUncomplete={() => handleUncomplete(task)}
                        onComplete={(person) => handleComplete(task, person)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <CalendarView tasks={tasks} completions={localCompletions} />
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
                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cfg.text}`}>{cfg.plural}</p>
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
