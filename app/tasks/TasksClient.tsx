'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare, Square, Plus, Pencil, Trash2, Loader2, X, Check,
  Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  createTask, updateTask, deleteTask, completeTask, uncompleteTask,
  setTaskWeekDay, setTaskWeekAssignee,
} from './actions'

type Task = {
  id: string; title: string; frequency: string
  day_of_week: string | null; assigned_to: string | null; notes: string | null
  custom_interval_days: number | null
}
type Completion    = { id: string; task_id: string; completed_date: string; completed_by: string | null }
type Profile       = { id: string; display_name: string | null; email: string }
type WeekAssignment = { id: string; task_id: string; week_start: string; day_of_week: string | null; assigned_to: string | null }

const FREQ_CONFIG: Record<string, { label: string; plural: string; period: string; bg: string; text: string; border: string; dot: string }> = {
  daily:    { label: 'Diaria',    plural: 'Diarias',    period: 'today',  bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200',    dot: 'bg-sky-400'    },
  weekly:   { label: 'Semanal',   plural: 'Semanales',  period: 'week',   bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  custom:   { label: 'Periódica', plural: 'Periódicas', period: 'recent', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-400'   },
  annual:   { label: 'Anual',     plural: 'Anuales',    period: 'year',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  punctual: { label: 'Puntual',   plural: 'Puntuales',  period: 'all',    bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-400'   },
}

const DAYS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
const DAY_LABEL: Record<string, string> = {
  lunes:'Lun', martes:'Mar', miércoles:'Mié', jueves:'Jue', viernes:'Vie', sábado:'Sáb', domingo:'Dom'
}

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now); monday.setDate(now.getDate() - day + 1)
  const sunday  = new Date(monday); sunday.setDate(monday.getDate() + 6)
  return { monday: fmtDate(monday), sunday: fmtDate(sunday) }
}

function formatInterval(days: number): string {
  if (days % 30 === 0) { const m = days / 30; return `Cada ${m} ${m === 1 ? 'mes' : 'meses'}` }
  if (days % 7  === 0) { const w = days / 7;  return `Cada ${w} ${w === 1 ? 'semana' : 'semanas'}` }
  return `Cada ${days} días`
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
  if (task.frequency === 'custom' && task.custom_interval_days) {
    const last = tc.sort((a, b) => b.completed_date.localeCompare(a.completed_date))[0]
    if (!last) return false
    const days = Math.floor((Date.now() - new Date(last.completed_date + 'T12:00:00').getTime()) / 86400000)
    return days < task.custom_interval_days
  }
  return false
}

function isDoneOnDate(task: Task, completions: Completion[], date: string): boolean {
  return completions.some(c => c.task_id === task.id && c.completed_date === date)
}

function isDoneInWeek(task: Task, completions: Completion[], weekStart: string, weekEnd: string): boolean {
  const tc = completions.filter(c => c.task_id === task.id)
  if (task.frequency === 'weekly')   return tc.some(c => c.completed_date >= weekStart && c.completed_date <= weekEnd)
  if (task.frequency === 'annual')   return tc.some(c => c.completed_date.startsWith(weekStart.slice(0, 4)))
  if (task.frequency === 'punctual') return tc.length > 0
  if (task.frequency === 'custom' && task.custom_interval_days) {
    const last = tc.sort((a, b) => b.completed_date.localeCompare(a.completed_date))[0]
    if (!last) return false
    const days = Math.floor((Date.now() - new Date(last.completed_date + 'T12:00:00').getTime()) / 86400000)
    return days < task.custom_interval_days
  }
  return false
}

function getEffectiveDay(task: Task, weekStart: string, assignments: WeekAssignment[]): string | null {
  const override = assignments.find(a => a.task_id === task.id && a.week_start === weekStart)
  if (override?.day_of_week) return override.day_of_week
  if (task.frequency === 'weekly' && task.day_of_week) return task.day_of_week
  return null
}

function getWeekAssignee(taskId: string, weekStart: string, assignments: WeekAssignment[]): string | null {
  return assignments.find(a => a.task_id === taskId && a.week_start === weekStart)?.assigned_to ?? null
}

function lastDone(task: Task, completions: Completion[]): string | null {
  const tc = completions.filter(c => c.task_id === task.id).sort((a, b) => b.completed_date.localeCompare(a.completed_date))
  return tc[0]?.completed_date ?? null
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
  const [intervalValue, setIntervalValue] = useState(() => {
    if (!initial?.custom_interval_days) return 2
    if (initial.custom_interval_days % 30 === 0) return initial.custom_interval_days / 30
    if (initial.custom_interval_days % 7  === 0) return initial.custom_interval_days / 7
    return initial.custom_interval_days
  })
  const [intervalUnit, setIntervalUnit] = useState<'dias' | 'semanas' | 'meses'>(() => {
    if (!initial?.custom_interval_days) return 'semanas'
    if (initial.custom_interval_days % 30 === 0) return 'meses'
    if (initial.custom_interval_days % 7  === 0) return 'semanas'
    return 'dias'
  })
  const [saving, setSaving] = useState(false)

  const computedIntervalDays =
    intervalUnit === 'dias'    ? intervalValue :
    intervalUnit === 'semanas' ? intervalValue * 7 : intervalValue * 30

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(), frequency,
      day_of_week:          dayOfWeek || null,
      assigned_to:          assignedTo || null,
      notes:                notes || null,
      custom_interval_days: frequency === 'custom' ? computedIntervalDays : null,
    })
    setSaving(false)
  }

  const cls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-300 bg-white'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-violet-200 p-5 space-y-3 shadow-sm">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{initial ? 'Editar tarea' : 'Nueva tarea'}</p>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la tarea *"
        className={cls} autoFocus required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Frecuencia</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} className={cls}>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="custom">Periódica (intervalo…)</option>
            <option value="annual">Anual</option>
            <option value="punctual">Puntual</option>
          </select>
        </div>
        {frequency === 'weekly' && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Día habitual</label>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className={cls}>
              <option value="">Sin día fijo</option>
              {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
        )}
        {frequency === 'custom' && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Intervalo</label>
            <div className="flex gap-1.5">
              <input type="number" min={1} max={365} value={intervalValue}
                onChange={e => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 border border-slate-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-violet-300 bg-white text-center font-bold" />
              <select value={intervalUnit} onChange={e => setIntervalUnit(e.target.value as 'dias' | 'semanas' | 'meses')}
                className="flex-1 border border-slate-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-violet-300 bg-white">
                <option value="dias">días</option>
                <option value="semanas">semanas</option>
                <option value="meses">meses</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">= cada {computedIntervalDays} días</p>
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asignada habitualmente a</label>
        <select value={assignedTo} onChange={e => setAssigned(e.target.value)} className={cls}>
          <option value="">Sin asignar</option>
          {profiles.map(p => (
            <option key={p.id} value={p.display_name ?? p.email}>{p.display_name ?? p.email}</option>
          ))}
        </select>
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)" className={cls} />
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

// ── Task card (Esta semana tab) ────────────────────────────────────────────────
// - Click name/person badge → assign who will do it (no completion)
// - Click checkbox → auto-complete with pre-assigned person, or ask if none
// - Day badge → day picker for this week

function TaskCard({
  task, done, last, profiles, weekStart, weekAssignments,
  onUncomplete, onComplete, onAssignWeek, onSetDayForWeek,
}: {
  task: Task; done: boolean; last: string | null
  profiles: Profile[]; weekStart: string; weekAssignments: WeekAssignment[]
  onUncomplete: () => void
  onComplete: (person: string) => void
  onAssignWeek: (person: string | null) => void
  onSetDayForWeek: (day: string | null) => void
}) {
  const [pickMode,      setPickMode]      = useState<null | 'assign' | 'complete'>(null)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual

  const weekAssignee = getWeekAssignee(task.id, weekStart, weekAssignments)
  const effectiveDay = getEffectiveDay(task, weekStart, weekAssignments)

  const handleCheckbox = () => {
    if (done) { onUncomplete(); return }
    if (weekAssignee) { onComplete(weekAssignee); return }
    setPickMode('complete')
    setShowDayPicker(false)
  }

  const handlePersonPick = (name: string) => {
    if (pickMode === 'complete') onComplete(name)
    else onAssignWeek(name)
    setPickMode(null)
  }

  const togglePersonPicker = () => {
    setPickMode(m => m === 'assign' ? null : 'assign')
    setShowDayPicker(false)
  }

  const toggleDayPicker = () => {
    setShowDayPicker(v => !v)
    setPickMode(null)
  }

  const isDayable = task.frequency !== 'daily'

  return (
    <div className={`flex flex-col p-4 rounded-2xl border transition-all ${done ? 'bg-slate-50/60 border-slate-100 opacity-70' : `${freq.bg} ${freq.border}`}`}>
      <div className="flex items-center gap-3">
        <button onClick={handleCheckbox} className="shrink-0">
          {done ? <CheckSquare size={22} className="text-emerald-500" /> : <Square size={22} className="text-slate-300" />}
        </button>

        {/* Task name — click to assign person */}
        <button className="flex-1 min-w-0 text-left" onClick={togglePersonPicker}>
          <p className={`font-bold text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </p>
          {task.frequency === 'custom' && task.custom_interval_days && (
            <p className="text-[10px] text-slate-400 mt-0.5">{formatInterval(task.custom_interval_days)}</p>
          )}
          {last && done && (
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
              ✓ {new Date(last + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {isDayable && (
            <button onClick={toggleDayPicker}
              className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors min-w-[30px] text-center ${
                showDayPicker ? 'bg-violet-500 text-white border-violet-500' :
                effectiveDay  ? `${freq.bg} ${freq.text} ${freq.border}` :
                'bg-slate-100 text-slate-400 border-transparent hover:bg-violet-50 hover:text-violet-500'
              }`}>
              {effectiveDay ? DAY_LABEL[effectiveDay] : '—'}
            </button>
          )}
          <button onClick={togglePersonPicker}
            className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors ${
              pickMode === 'assign' ? 'bg-violet-500 text-white border-violet-500' :
              weekAssignee ? `${freq.bg} ${freq.text} ${freq.border}` :
              'bg-slate-100 text-slate-400 border-transparent hover:bg-violet-50 hover:text-violet-500'
            }`}>
            {weekAssignee ?? '···'}
          </button>
        </div>
      </div>

      {/* Person picker */}
      {(pickMode === 'assign' || pickMode === 'complete') && (
        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {pickMode === 'complete' ? '¿Quién lo ha hecho?' : '¿Quién lo va a hacer?'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profiles.map(p => {
              const name = p.display_name ?? p.email.split('@')[0]
              const isCurrent = weekAssignee === name && pickMode === 'assign'
              return (
                <button key={p.id} onClick={() => handlePersonPick(name)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    isCurrent ? 'bg-violet-500 text-white border-violet-500' :
                    `${freq.bg} ${freq.text} ${freq.border} hover:opacity-70`
                  }`}>
                  {name}
                </button>
              )
            })}
            {weekAssignee && pickMode === 'assign' && (
              <button onClick={() => { onAssignWeek(null); setPickMode(null) }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500">
                Quitar
              </button>
            )}
            <button onClick={() => setPickMode(null)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-300 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Day picker */}
      {showDayPicker && (
        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Asignar día esta semana</p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map(d => (
              <button key={d} onClick={() => { setShowDayPicker(false); onSetDayForWeek(d) }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  effectiveDay === d ? 'bg-violet-500 text-white border-violet-500' :
                  `${freq.bg} ${freq.text} ${freq.border} hover:opacity-70`
                }`}>
                {DAY_LABEL[d]}
              </button>
            ))}
            {task.frequency !== 'weekly' && effectiveDay && (
              <button onClick={() => { setShowDayPicker(false); onSetDayForWeek(null) }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50">
                Sin día
              </button>
            )}
            <button onClick={() => setShowDayPicker(false)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-300 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Task row (calendar day list) ──────────────────────────────────────────────

function TaskDayRow({
  task, isComplete, profiles, weekStart, weekAssignments, onComplete, onUncomplete, onSetDay,
}: {
  task: Task; isComplete: boolean; profiles: Profile[]
  weekStart: string; weekAssignments: WeekAssignment[]
  onComplete: (task: Task, person: string) => void
  onUncomplete: (task: Task) => void
  onSetDay: (taskId: string, weekStart: string, day: string | null) => void
}) {
  const [mode, setMode] = useState<null | 'person' | 'day'>(null)
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
  const effectiveDay = getEffectiveDay(task, weekStart, weekAssignments)
  const weekAssignee = getWeekAssignee(task.id, weekStart, weekAssignments)

  return (
    <div className={`px-4 py-3 transition-all ${isComplete ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <button className="shrink-0"
          onClick={() => isComplete ? onUncomplete(task) : setMode(m => m === 'person' ? null : 'person')}>
          {isComplete ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-300" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isComplete ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
          {weekAssignee && (
            <p className={`text-[10px] mt-0.5 ${isComplete ? 'text-slate-300' : 'text-slate-400'}`}>{weekAssignee}</p>
          )}
        </div>
        {task.frequency !== 'daily' && (
          <button onClick={() => setMode(m => m === 'day' ? null : 'day')}
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
              mode === 'day' ? 'bg-violet-500 text-white' :
              effectiveDay  ? `${freq.bg} ${freq.text}` : 'text-slate-300 hover:text-violet-400'
            }`}>
            {effectiveDay ? DAY_LABEL[effectiveDay] : '·'}
          </button>
        )}
      </div>

      {mode === 'person' && (
        <div className="mt-2 ml-9 pt-2 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">¿Quién lo ha hecho?</p>
          <div className="flex flex-wrap gap-1">
            {profiles.map(p => {
              const name = p.display_name ?? p.email.split('@')[0]
              return (
                <button key={p.id} onClick={() => { setMode(null); onComplete(task, name) }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-violet-50 text-slate-600">
                  {name}
                </button>
              )
            })}
            <button onClick={() => setMode(null)} className="text-[10px] text-slate-400 px-1">✕</button>
          </div>
        </div>
      )}

      {mode === 'day' && (
        <div className="mt-2 ml-9 pt-2 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">Mover a</p>
          <div className="flex flex-wrap gap-1">
            {DAYS.map(d => (
              <button key={d} onClick={() => { setMode(null); onSetDay(task.id, weekStart, d) }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  effectiveDay === d ? 'bg-violet-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-violet-50'
                }`}>
                {DAY_LABEL[d]}
              </button>
            ))}
            {task.frequency !== 'weekly' && effectiveDay && (
              <button onClick={() => { setMode(null); onSetDay(task.id, weekStart, null) }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-400 hover:bg-red-50">
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Calendar / Planning view ───────────────────────────────────────────────────

const DOW_ABBR = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function CalendarView({
  tasks, completions, profiles, weekAssignments, togglingId, onComplete, onUncomplete, onSetDay,
}: {
  tasks: Task[]; completions: Completion[]; profiles: Profile[]
  weekAssignments: WeekAssignment[]; togglingId: string | null
  onComplete: (task: Task, person: string) => void
  onUncomplete: (task: Task) => void
  onSetDay: (taskId: string, weekStart: string, day: string | null) => void
}) {
  const [mode, setMode]     = useState<'week' | 'month'>('week')
  const [offset, setOffset] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const byDate: Record<string, Completion[]> = {}
  for (const c of completions) {
    if (!byDate[c.completed_date]) byDate[c.completed_date] = []
    byDate[c.completed_date].push(c)
  }

  // ── Week calculations ──────────────────────────────────────────────────────
  const now      = new Date()
  const todayDow = now.getDay() || 7
  const monBase  = new Date(now)
  monBase.setDate(now.getDate() - todayDow + 1 + offset * 7)

  const weekDays  = Array.from({ length: 7 }, (_, i) => { const d = new Date(monBase); d.setDate(monBase.getDate() + i); return d })
  const weekStart = fmtDate(weekDays[0])
  const weekEnd   = fmtDate(weekDays[6])

  // ── Month calculations ─────────────────────────────────────────────────────
  const refDate     = new Date(now.getFullYear(), now.getMonth() + (mode === 'month' ? offset : 0), 1)
  const yr          = refDate.getFullYear()
  const mo          = refDate.getMonth()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const firstDow    = (new Date(yr, mo, 1).getDay() + 6) % 7

  const monthName = refDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const weekLabel = `${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`

  const unscheduled = tasks.filter(t => t.frequency !== 'daily' && getEffectiveDay(t, weekStart, weekAssignments) === null)

  return (
    <div>
      {/* Controls */}
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

      {/* ── WEEK LIST VIEW ──────────────────────────────────────────────────── */}
      {mode === 'week' && (
        <>
          <div className="space-y-3 mb-4">
            {weekDays.map(d => {
              const ds      = fmtDate(d)
              const dayName = DAYS[(d.getDay() + 6) % 7]
              const isToday = ds === today

              const dailyTasks     = tasks.filter(t => t.frequency === 'daily')
              const scheduledTasks = tasks.filter(t => t.frequency !== 'daily' && getEffectiveDay(t, weekStart, weekAssignments) === dayName)
              const allInDay       = [...dailyTasks, ...scheduledTasks]

              const doneCount = allInDay.filter(t =>
                t.frequency === 'daily'
                  ? isDoneOnDate(t, completions, ds)
                  : isDoneInWeek(t, completions, weekStart, weekEnd)
              ).length

              return (
                <div key={ds} className={`rounded-2xl border overflow-hidden ${isToday ? 'border-lime-300 shadow-sm' : 'border-slate-100'}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-lime-400' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black capitalize ${isToday ? 'text-white' : 'text-slate-700'}`}>
                        {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                      </span>
                      <span className={`text-xs ${isToday ? 'text-white/70' : 'text-slate-400'}`}>
                        {d.getDate()} {d.toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                    </div>
                    <span className={`text-xs font-black ${isToday ? 'text-white/70' : 'text-slate-400'}`}>
                      {doneCount}/{allInDay.length}
                    </span>
                  </div>

                  {allInDay.length > 0 ? (
                    <div className="divide-y divide-slate-50 bg-white">
                      {allInDay.map(task => (
                        <div key={task.id} className="relative">
                          {togglingId === task.id && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60">
                              <Loader2 size={12} className="animate-spin text-violet-500" />
                            </div>
                          )}
                          <TaskDayRow
                            task={task}
                            isComplete={task.frequency === 'daily'
                              ? isDoneOnDate(task, completions, ds)
                              : isDoneInWeek(task, completions, weekStart, weekEnd)}
                            profiles={profiles}
                            weekStart={weekStart}
                            weekAssignments={weekAssignments}
                            onComplete={onComplete}
                            onUncomplete={onUncomplete}
                            onSetDay={onSetDay}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white px-4 py-3">
                      <p className="text-xs text-slate-300">Sin tareas asignadas</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {unscheduled.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sin asignar esta semana</p>
              <div className="space-y-2.5">
                {unscheduled.map(task => {
                  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
                  return (
                    <div key={task.id} className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${freq.bg} ${freq.text} ${freq.border}`}>
                        {task.title}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {DAYS.map(d => (
                          <button key={d} onClick={() => onSetDay(task.id, weekStart, d)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-violet-50 hover:border-violet-300 transition-colors">
                            {DAY_LABEL[d]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MONTH VIEW (history dots) ───────────────────────────────────────── */}
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
                  dc.length > 0 ? 'bg-white border-slate-100' : 'border-transparent bg-white'
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
                    {dc.length > 3 && <span className="text-[8px] font-black text-slate-300">+{dc.length - 3}</span>}
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
  tasks, completions, profiles, weekAssignments, currentUser,
}: {
  tasks: Task[]; completions: Completion[]; profiles: Profile[]
  weekAssignments: WeekAssignment[]; currentUser: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [view, setView]     = useState<'pending' | 'all' | 'calendar'>('pending')
  const [showForm, setShowForm]     = useState(false)
  const [editing,  setEditing]      = useState<Task | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCompletions,     setLocalCompletions]     = useState<Completion[]>(completions)
  const [localWeekAssignments, setLocalWeekAssignments] = useState<WeekAssignment[]>(weekAssignments)

  const refresh = () => startTransition(() => router.refresh())
  const currentWeekStart = getWeekRange().monday

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUncomplete = async (task: Task) => {
    setTogglingId(task.id)
    const period = FREQ_CONFIG[task.frequency]?.period ?? 'all'
    setLocalCompletions(prev => prev.filter(c => {
      if (c.task_id !== task.id) return true
      const today = new Date().toISOString().split('T')[0]
      const year  = new Date().getFullYear()
      const { monday, sunday } = getWeekRange()
      if (period === 'today')  return c.completed_date !== today
      if (period === 'week')   return !(c.completed_date >= monday && c.completed_date <= sunday)
      if (period === 'year')   return !c.completed_date.startsWith(String(year))
      if (period === 'recent') return false // remove all for now (action handles the specific one)
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

  const handleSetDay = async (taskId: string, ws: string, day: string | null) => {
    setLocalWeekAssignments(prev => {
      const without   = prev.filter(a => !(a.task_id === taskId && a.week_start === ws))
      const existing  = prev.find(a => a.task_id === taskId && a.week_start === ws)
      if (day === null) {
        if (existing?.assigned_to) return [...without, { ...existing, day_of_week: null }]
        return without
      }
      if (existing) return [...without, { ...existing, day_of_week: day }]
      return [...without, { id: 'tmp', task_id: taskId, week_start: ws, day_of_week: day, assigned_to: null }]
    })
    await setTaskWeekDay(taskId, ws, day)
    refresh()
  }

  const handleAssignWeek = async (taskId: string, ws: string, person: string | null) => {
    setLocalWeekAssignments(prev => {
      const without  = prev.filter(a => !(a.task_id === taskId && a.week_start === ws))
      const existing = prev.find(a => a.task_id === taskId && a.week_start === ws)
      if (person === null) {
        if (existing?.day_of_week) return [...without, { ...existing, assigned_to: null }]
        return without
      }
      if (existing) return [...without, { ...existing, assigned_to: person }]
      return [...without, { id: 'tmp', task_id: taskId, week_start: ws, day_of_week: null, assigned_to: person }]
    })
    await setTaskWeekAssignee(taskId, ws, person)
    refresh()
  }

  const handleSave = async (data: Omit<Task, 'id'>) => {
    const payload = {
      title: data.title, frequency: data.frequency,
      day_of_week:          data.day_of_week ?? undefined,
      assigned_to:          data.assigned_to ?? undefined,
      notes:                data.notes ?? undefined,
      custom_interval_days: data.custom_interval_days ?? undefined,
    }
    if (editing) { await updateTask(editing.id, payload); setEditing(null) }
    else         { await createTask(payload); setShowForm(false) }
    refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    setDeletingId(id)
    await deleteTask(id)
    setDeletingId(null)
    refresh()
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  const totalDone    = tasks.filter(t =>  isDone(t, localCompletions)).length
  const totalPending = tasks.filter(t => !isDone(t, localCompletions)).length
  const overallPct   = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0

  const byFreq: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (!byFreq[t.frequency]) byFreq[t.frequency] = []
    byFreq[t.frequency].push(t)
  }
  const freqOrder = ['daily', 'weekly', 'custom', 'annual', 'punctual']

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 animate-in fade-in">

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tareas del hogar</h1>
          <p className="text-slate-400 font-medium mt-1 text-sm">{totalDone} completadas · {totalPending} pendientes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null) }}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Añadir tarea
        </button>
      </header>

      {/* Global progress bar — always visible */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${overallPct === 100 ? 'bg-emerald-400' : 'bg-lime-400'}`}
              style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-sm font-black text-slate-600 shrink-0">{overallPct}%</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {freqOrder.filter(f => byFreq[f]?.length).map(freq => {
            const cfg = FREQ_CONFIG[freq]; const fc = byFreq[freq] ?? []
            const fd  = fc.filter(t => isDone(t, localCompletions)).length
            return (
              <div key={freq} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-[11px] font-bold text-slate-500">{cfg.plural} {fd}/{fc.length}</span>
              </div>
            )
          })}
        </div>
      </div>

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
          ['calendar', '📅 Semana'],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ESTA SEMANA ────────────────────────────────────────────────────── */}
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
            const cfg       = FREQ_CONFIG[freq]
            const freqTasks = (byFreq[freq] ?? []).slice().sort((a, b) =>
              freq === 'weekly' ? DAYS.indexOf(a.day_of_week ?? '') - DAYS.indexOf(b.day_of_week ?? '') : 0
            )
            const doneCnt = freqTasks.filter(t => isDone(t, localCompletions)).length
            const pct     = freqTasks.length > 0 ? Math.round((doneCnt / freqTasks.length) * 100) : 0
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
                        weekStart={currentWeekStart}
                        weekAssignments={localWeekAssignments}
                        onUncomplete={() => handleUncomplete(task)}
                        onComplete={(person) => handleComplete(task, person)}
                        onAssignWeek={(person) => handleAssignWeek(task.id, currentWeekStart, person)}
                        onSetDayForWeek={(day) => handleSetDay(task.id, currentWeekStart, day)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SEMANA (PLANNING CALENDAR) ─────────────────────────────────────── */}
      {view === 'calendar' && (
        <CalendarView
          tasks={tasks}
          completions={localCompletions}
          profiles={profiles}
          weekAssignments={localWeekAssignments}
          togglingId={togglingId}
          onComplete={handleComplete}
          onUncomplete={handleUncomplete}
          onSetDay={handleSetDay}
        />
      )}

      {/* ── GESTIONAR ─────────────────────────────────────────────────────── */}
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
                              {task.custom_interval_days && <span> · {formatInterval(task.custom_interval_days)}</span>}
                              {task.notes && <span> · {task.notes}</span>}
                              {lastDone(task, localCompletions) && (
                                <span className="text-emerald-600"> · Última: {new Date(lastDone(task, localCompletions)! + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
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
