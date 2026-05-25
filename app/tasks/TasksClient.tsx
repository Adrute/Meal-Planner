'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, ShieldCheck, Plus, Pencil, Trash2, Loader2, X, Check,
  Swords, Crown, Gem, Trophy, Sparkles, ChevronLeft, ChevronRight, ScrollText, Flame,
} from 'lucide-react'
import {
  createTask, updateTask, deleteTask, completeTask, uncompleteTask, uncompleteTaskOnDate,
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

const FREQ_CONFIG: Record<string, {
  label: string; plural: string; period: string
  bg: string; text: string; border: string; dot: string
  darkBg: string; darkText: string; darkBorder: string
  Icon: React.ElementType
}> = {
  daily:    { label: 'Diaria',      plural: 'Misiones Diarias',      period: 'today',  bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-400',     darkBg: 'bg-sky-900/40',    darkText: 'text-sky-300',    darkBorder: 'border-sky-700',    Icon: Swords   },
  weekly:   { label: 'Semanal',     plural: 'Misiones Semanales',    period: 'week',   bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-400',  darkBg: 'bg-violet-900/40', darkText: 'text-violet-300', darkBorder: 'border-violet-700', Icon: Shield   },
  custom:   { label: 'Épica',       plural: 'Misiones Épicas',       period: 'recent', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   darkBg: 'bg-amber-900/40',  darkText: 'text-amber-300',  darkBorder: 'border-amber-700',  Icon: Gem      },
  annual:   { label: 'Legendaria',  plural: 'Misiones Legendarias',  period: 'year',   bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-400',    darkBg: 'bg-rose-900/40',   darkText: 'text-rose-300',   darkBorder: 'border-rose-700',   Icon: Crown    },
  punctual: { label: 'Única',       plural: 'Contratos',             period: 'all',    bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-400',  darkBg: 'bg-orange-900/40', darkText: 'text-orange-300', darkBorder: 'border-orange-700', Icon: ScrollText },
}

const DAYS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
const DAY_LABEL: Record<string, string> = {
  lunes:'Lun', martes:'Mar', miércoles:'Mié', jueves:'Jue', viernes:'Vie', sábado:'Sáb', domingo:'Dom'
}

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

function parseNames(val: string | null | undefined): string[] {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}
function joinNames(names: string[]): string | null {
  return names.length > 0 ? names.join(', ') : null
}
function filterProfiles(profiles: Profile[]): Profile[] {
  return profiles.filter(p => p.display_name && p.display_name.toLowerCase() !== 'admin')
}

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
  if (task.frequency === 'custom')   return tc.some(c => c.completed_date >= weekStart && c.completed_date <= weekEnd)
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

function getNextDueDate(task: Task, completions: Completion[]): string | null {
  if (task.frequency !== 'custom' || !task.custom_interval_days) return null
  const last = lastDone(task, completions)
  if (!last) return new Date().toISOString().split('T')[0]
  const d = new Date(last + 'T12:00:00')
  d.setDate(d.getDate() + task.custom_interval_days)
  return fmtDate(d)
}

function getCustomDayForWeek(task: Task, completions: Completion[], weekStart: string, weekEnd: string): string | null {
  const nextDue = getNextDueDate(task, completions)
  if (!nextDue || nextDue > weekEnd) return null
  if (nextDue >= weekStart) return DAYS[(new Date(nextDue + 'T12:00:00').getDay() + 6) % 7]
  return DAYS[0]
}

// ── Quest form ─────────────────────────────────────────────────────────────────

function TaskForm({
  initial, profiles, onSave, onCancel,
}: {
  initial?: Task | null
  profiles: Profile[]
  onSave: (data: Omit<Task, 'id'> & { last_done_date?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [title,      setTitle]     = useState(initial?.title ?? '')
  const [frequency,  setFrequency] = useState(initial?.frequency ?? 'weekly')
  const [dayOfWeek,  setDayOfWeek] = useState(initial?.day_of_week ?? '')
  const [assignedTo, setAssigned]  = useState<string[]>(parseNames(initial?.assigned_to))
  const [notes,      setNotes]     = useState(initial?.notes ?? '')
  const [lastDoneDate, setLastDoneDate] = useState('')
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
      assigned_to:          joinNames(assignedTo),
      notes:                notes || null,
      custom_interval_days: frequency === 'custom' ? computedIntervalDays : null,
      last_done_date:       frequency === 'custom' && lastDoneDate ? lastDoneDate : undefined,
    })
    setSaving(false)
  }

  const cls = 'w-full border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 bg-slate-800 text-slate-100 placeholder:text-slate-500'

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-amber-500/30 p-5 space-y-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <ScrollText size={14} className="text-amber-400" />
        <p className="text-xs font-black text-amber-400 uppercase tracking-widest">{initial ? 'Editar misión' : 'Nueva misión'}</p>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la misión *"
        className={cls} autoFocus required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo de misión</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} className={cls}>
            <option value="daily">Diaria ⚔️</option>
            <option value="weekly">Semanal 🛡️</option>
            <option value="custom">Épica (intervalo…) 💎</option>
            <option value="annual">Legendaria 👑</option>
            <option value="punctual">Única ✨</option>
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
                className="w-16 border border-slate-700 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-amber-500 bg-slate-800 text-slate-100 text-center font-bold" />
              <select value={intervalUnit} onChange={e => setIntervalUnit(e.target.value as 'dias' | 'semanas' | 'meses')}
                className="flex-1 border border-slate-700 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-amber-500 bg-slate-800 text-slate-100">
                <option value="dias">días</option>
                <option value="semanas">semanas</option>
                <option value="meses">meses</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">= cada {computedIntervalDays} días</p>
          </div>
        )}
      </div>

      {frequency === 'custom' && !initial && (
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Última vez completada <span className="text-slate-600 font-normal normal-case">(opcional)</span>
          </label>
          <input type="date" value={lastDoneDate} onChange={e => setLastDoneDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={cls} />
          {lastDoneDate && computedIntervalDays > 0 && (
            <p className="text-[10px] text-amber-400 font-bold mt-1">
              Próxima misión: {new Date(new Date(lastDoneDate + 'T12:00:00').getTime() + computedIntervalDays * 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Aventurero asignado</label>
        <div className="flex flex-wrap gap-1.5">
          {filterProfiles(profiles).map(p => {
            const name = p.display_name!
            const active = assignedTo.includes(name)
            return (
              <button key={p.id} type="button"
                onClick={() => setAssigned(prev => active ? prev.filter(n => n !== name) : [...prev, name])}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${active ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500 hover:text-amber-400'}`}>
                {name}
              </button>
            )
          })}
          {assignedTo.length > 0 && (
            <button type="button" onClick={() => setAssigned([])}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 text-slate-500 hover:bg-red-900/30 hover:text-red-400">
              Quitar todos
            </button>
          )}
        </div>
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas de la misión (opcional)" className={cls} />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {initial ? 'Guardar misión' : 'Crear misión'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Quest card (Misiones activas tab) ─────────────────────────────────────────

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
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
  const FreqIcon = freq.Icon

  const weekAssignee  = getWeekAssignee(task.id, weekStart, weekAssignments)
  const assignedNames = parseNames(weekAssignee)
  const effectiveDay  = getEffectiveDay(task, weekStart, weekAssignments)

  const handleCheckbox = () => {
    if (done) { onUncomplete(); return }
    if (weekAssignee) { onComplete(assignedNames[0] ?? weekAssignee); return }
    setPickMode('complete')
    setShowDayPicker(false)
  }

  const togglePersonPicker = () => {
    if (pickMode !== 'assign') setSelectedNames(assignedNames)
    setPickMode(m => m === 'assign' ? null : 'assign')
    setShowDayPicker(false)
  }

  const toggleName = (name: string) =>
    setSelectedNames(prev => {
      if (name === 'N/A') return ['N/A']
      const withoutNA = prev.filter(n => n !== 'N/A')
      return withoutNA.includes(name) ? withoutNA.filter(n => n !== name) : [...withoutNA, name]
    })

  const badgeText = assignedNames.length === 0 ? '···'
    : assignedNames.length === 1 ? assignedNames[0]
    : `${assignedNames[0]} +${assignedNames.length - 1}`

  const toggleDayPicker = () => {
    setShowDayPicker(v => !v)
    setPickMode(null)
  }

  const isDayable = task.frequency !== 'daily'

  return (
    <div className={`flex flex-col rounded-2xl border transition-all overflow-hidden ${
      done
        ? 'bg-slate-900/60 border-slate-700/50 opacity-60'
        : `bg-slate-900 border-slate-700 shadow-lg`
    }`}>
      {/* Color strip on top */}
      {!done && <div className={`h-0.5 w-full ${freq.dot}`} />}

      <div className="flex items-center gap-3 p-4">
        <button onClick={handleCheckbox} className="shrink-0">
          {done
            ? <ShieldCheck size={22} className="text-emerald-400" />
            : <Shield size={22} className={freq.darkText} />
          }
        </button>

        <button className="flex-1 min-w-0 text-left" onClick={togglePersonPicker}>
          <p className={`font-bold text-sm ${done ? 'line-through text-slate-500' : 'text-slate-100'}`}>
            {task.title}
          </p>
          {task.frequency === 'custom' && task.custom_interval_days && (
            <p className="text-[10px] text-slate-500 mt-0.5">{formatInterval(task.custom_interval_days)}</p>
          )}
          {last && done && (
            <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
              ✓ {new Date(last + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {isDayable && (
            <button onClick={toggleDayPicker}
              className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors min-w-[30px] text-center ${
                showDayPicker ? 'bg-amber-500 text-slate-900 border-amber-500' :
                effectiveDay  ? `${freq.darkBg} ${freq.darkText} ${freq.darkBorder}` :
                'bg-slate-800 text-slate-600 border-slate-700 hover:border-amber-500 hover:text-amber-400'
              }`}>
              {effectiveDay ? DAY_LABEL[effectiveDay] : '—'}
            </button>
          )}
          <button onClick={togglePersonPicker}
            className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors max-w-[90px] truncate ${
              pickMode === 'assign' ? 'bg-amber-500 text-slate-900 border-amber-500' :
              assignedNames.length > 0 ? `${freq.darkBg} ${freq.darkText} ${freq.darkBorder}` :
              'bg-slate-800 text-slate-600 border-slate-700 hover:border-amber-500 hover:text-amber-400'
            }`}>
            {badgeText}
          </button>
        </div>
      </div>

      {(pickMode === 'assign' || pickMode === 'complete') && (
        <div className="mx-4 mb-4 pt-3 border-t border-slate-700/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {pickMode === 'complete' ? '¿Qué aventurero lo completa?' : '¿Quién acepta la misión?'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filterProfiles(profiles).map(p => {
              const name = p.display_name!
              if (pickMode === 'complete') {
                return (
                  <button key={p.id} onClick={() => { onComplete(name); setPickMode(null) }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${freq.darkBg} ${freq.darkText} ${freq.darkBorder} hover:opacity-70`}>
                    {name}
                  </button>
                )
              }
              const isSelected = selectedNames.includes(name)
              return (
                <button key={p.id} onClick={() => toggleName(name)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    isSelected ? 'bg-amber-500 text-slate-900 border-amber-500' :
                    `${freq.darkBg} ${freq.darkText} ${freq.darkBorder} hover:opacity-70`
                  }`}>
                  {isSelected ? `✓ ${name}` : name}
                </button>
              )
            })}
            {pickMode === 'complete' && (
              <button onClick={() => { onComplete('N/A'); setPickMode(null) }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 text-slate-500 hover:bg-slate-800 transition-all">
                N/A
              </button>
            )}
            {pickMode === 'assign' && (
              <button onClick={() => toggleName('N/A')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  selectedNames.includes('N/A') ? 'bg-slate-600 text-white border-slate-600' :
                  'border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}>
                {selectedNames.includes('N/A') ? '✓ N/A' : 'N/A'}
              </button>
            )}
          </div>
          {pickMode === 'assign' && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => { onAssignWeek(joinNames(selectedNames)); setPickMode(null) }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors">
                Confirmar
              </button>
              {assignedNames.length > 0 && (
                <button onClick={() => { onAssignWeek(null); setPickMode(null) }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 text-slate-500 hover:bg-red-900/30 hover:text-red-400">
                  Quitar todos
                </button>
              )}
              <button onClick={() => setPickMode(null)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 text-slate-600 hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          )}
          {pickMode === 'complete' && (
            <button onClick={() => setPickMode(null)}
              className="text-xs mt-2 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-600 hover:bg-slate-800">
              Cancelar
            </button>
          )}
        </div>
      )}

      {showDayPicker && (
        <div className="mx-4 mb-4 pt-3 border-t border-slate-700/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Asignar día esta semana</p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map(d => (
              <button key={d} onClick={() => { setShowDayPicker(false); onSetDayForWeek(d) }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  effectiveDay === d ? 'bg-amber-500 text-slate-900 border-amber-500' :
                  `${freq.darkBg} ${freq.darkText} ${freq.darkBorder} hover:opacity-70`
                }`}>
                {DAY_LABEL[d]}
              </button>
            ))}
            {task.frequency !== 'weekly' && effectiveDay && (
              <button onClick={() => { setShowDayPicker(false); onSetDayForWeek(null) }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 text-slate-500 hover:bg-red-900/30">
                Sin día
              </button>
            )}
            <button onClick={() => setShowDayPicker(false)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 text-slate-600 hover:bg-slate-800">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Quest row (calendar day list) ─────────────────────────────────────────────

function TaskDayRow({
  task, isComplete, completedBy, profiles, weekStart, weekAssignments, date, onComplete, onUncomplete, onSetDay,
}: {
  task: Task; isComplete: boolean; completedBy: string | null; profiles: Profile[]
  weekStart: string; weekAssignments: WeekAssignment[]
  date: string
  onComplete: (task: Task, person: string, date: string) => void
  onUncomplete: (task: Task, date: string) => void
  onSetDay: (taskId: string, weekStart: string, day: string | null) => void
}) {
  const [mode, setMode] = useState<null | 'person' | 'day'>(null)
  const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
  const effectiveDay = getEffectiveDay(task, weekStart, weekAssignments)
  const weekAssignee = getWeekAssignee(task.id, weekStart, weekAssignments)

  return (
    <div className={`px-4 py-3 transition-all ${isComplete ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <button className="shrink-0"
          onClick={() => isComplete ? onUncomplete(task, date) : setMode(m => m === 'person' ? null : 'person')}>
          {isComplete
            ? <ShieldCheck size={18} className="text-emerald-400" />
            : <Shield size={18} className={freq.darkText} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
          {isComplete && completedBy && completedBy !== 'N/A' ? (
            <p className="text-[10px] mt-0.5 text-emerald-400 font-bold">✓ {completedBy}</p>
          ) : !isComplete && weekAssignee ? (
            <p className="text-[10px] mt-0.5 text-slate-500">{weekAssignee}</p>
          ) : null}
        </div>
        {task.frequency !== 'daily' && (
          <button onClick={() => setMode(m => m === 'day' ? null : 'day')}
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
              mode === 'day' ? 'bg-amber-500 text-slate-900' :
              effectiveDay  ? `${freq.darkBg} ${freq.darkText}` : 'text-slate-600 hover:text-amber-400'
            }`}>
            {effectiveDay ? DAY_LABEL[effectiveDay] : '·'}
          </button>
        )}
      </div>

      {mode === 'person' && (
        <div className="mt-2 ml-9 pt-2 border-t border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1.5">¿Qué aventurero lo completa?</p>
          <div className="flex flex-wrap gap-1">
            {filterProfiles(profiles).map(p => (
              <button key={p.id} onClick={() => { setMode(null); onComplete(task, p.display_name!, date) }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-400">
                {p.display_name}
              </button>
            ))}
            <button onClick={() => { setMode(null); onComplete(task, 'N/A', date) }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-600 hover:bg-slate-700">N/A</button>
            <button onClick={() => setMode(null)} className="text-[10px] text-slate-600 px-1">✕</button>
          </div>
        </div>
      )}

      {mode === 'day' && (
        <div className="mt-2 ml-9 pt-2 border-t border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1.5">Mover a</p>
          <div className="flex flex-wrap gap-1">
            {DAYS.map(d => (
              <button key={d} onClick={() => { setMode(null); onSetDay(task.id, weekStart, d) }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  effectiveDay === d ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-amber-500'
                }`}>
                {DAY_LABEL[d]}
              </button>
            ))}
            {task.frequency !== 'weekly' && effectiveDay && (
              <button onClick={() => { setMode(null); onSetDay(task.id, weekStart, null) }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-500 hover:bg-red-900/30">
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Map / Planning view ───────────────────────────────────────────────────────

function CalendarView({
  tasks, completions, profiles, weekAssignments, togglingId, onComplete, onUncomplete, onSetDay,
}: {
  tasks: Task[]; completions: Completion[]; profiles: Profile[]
  weekAssignments: WeekAssignment[]; togglingId: string | null
  onComplete: (task: Task, person: string, date: string) => void
  onUncomplete: (task: Task, date: string) => void
  onSetDay: (taskId: string, weekStart: string, day: string | null) => void
}) {
  const [offset, setOffset] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const now      = new Date()
  const todayDow = now.getDay() || 7
  const monBase  = new Date(now)
  monBase.setDate(now.getDate() - todayDow + 1 + offset * 7)

  const weekDays  = Array.from({ length: 7 }, (_, i) => { const d = new Date(monBase); d.setDate(monBase.getDate() + i); return d })
  const weekStart = fmtDate(weekDays[0])
  const weekEnd   = fmtDate(weekDays[6])

  const weekLabel = `${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`

  const unscheduled = tasks.filter(t =>
    t.frequency !== 'daily' &&
    t.frequency !== 'custom' &&
    getEffectiveDay(t, weekStart, weekAssignments) === null
  )

  return (
    <div>
      <div className="flex items-center justify-end mb-5 gap-0.5">
        <button onClick={() => setOffset(o => o - 1)}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-slate-300 min-w-[190px] text-center capitalize">
          {weekLabel}
        </span>
        <button onClick={() => setOffset(o => o + 1)}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronRight size={18} />
        </button>
        {offset !== 0 && (
          <button onClick={() => setOffset(0)}
            className="ml-1 text-xs font-bold text-amber-400 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors">
            Hoy
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {weekDays.map(d => {
          const ds      = fmtDate(d)
          const dayName = DAYS[(d.getDay() + 6) % 7]
          const isToday = ds === today

          const dailyTasks     = tasks.filter(t => t.frequency === 'daily')
          const scheduledTasks = tasks.filter(t => {
            if (t.frequency === 'daily') return false
            if (t.frequency === 'custom') return getCustomDayForWeek(t, completions, weekStart, weekEnd) === dayName
            return getEffectiveDay(t, weekStart, weekAssignments) === dayName
          })
          const allInDay = [...dailyTasks, ...scheduledTasks]

          const doneCount = allInDay.filter(t =>
            t.frequency === 'daily'
              ? isDoneOnDate(t, completions, ds)
              : isDoneInWeek(t, completions, weekStart, weekEnd)
          ).length

          return (
            <div key={ds} className={`rounded-2xl border overflow-hidden ${isToday ? 'border-amber-500 shadow-amber-900/40 shadow-lg' : 'border-slate-700/50'}`}>
              <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-amber-500' : 'bg-slate-800'}`}>
                <div className="flex items-center gap-2">
                  {isToday && <Flame size={14} className="text-slate-900" />}
                  <span className={`text-sm font-black capitalize ${isToday ? 'text-slate-900' : 'text-slate-300'}`}>
                    {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                  </span>
                  <span className={`text-xs ${isToday ? 'text-slate-900/70' : 'text-slate-500'}`}>
                    {d.getDate()} {d.toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
                <span className={`text-xs font-black ${isToday ? 'text-slate-900/70' : 'text-slate-500'}`}>
                  {doneCount}/{allInDay.length}
                </span>
              </div>

              {allInDay.length > 0 ? (
                <div className="divide-y divide-slate-800 bg-slate-900">
                  {allInDay.map(task => (
                    <div key={task.id} className="relative">
                      {togglingId === task.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/60">
                          <Loader2 size={12} className="animate-spin text-amber-400" />
                        </div>
                      )}
                      <TaskDayRow
                        task={task}
                        isComplete={task.frequency === 'daily'
                          ? isDoneOnDate(task, completions, ds)
                          : isDoneInWeek(task, completions, weekStart, weekEnd)}
                        completedBy={(() => {
                          const tc = completions.filter(c => c.task_id === task.id)
                          const match = task.frequency === 'daily'
                            ? tc.find(c => c.completed_date === ds)
                            : tc.find(c => c.completed_date >= weekStart && c.completed_date <= weekEnd)
                          return match?.completed_by ?? null
                        })()}
                        profiles={profiles}
                        weekStart={weekStart}
                        weekAssignments={weekAssignments}
                        date={ds}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
                        onSetDay={onSetDay}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 px-4 py-3">
                  <p className="text-xs text-slate-600">Sin misiones asignadas</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Misiones sin asignar esta semana</p>
          <div className="space-y-2.5">
            {unscheduled.map(task => {
              const freq = FREQ_CONFIG[task.frequency] ?? FREQ_CONFIG.punctual
              return (
                <div key={task.id} className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${freq.darkBg} ${freq.darkText} ${freq.darkBorder}`}>
                    {task.title}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {DAYS.map(d => (
                      <button key={d} onClick={() => onSetDay(task.id, weekStart, d)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-colors">
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

  useEffect(() => { setLocalCompletions(completions) },     [completions])
  useEffect(() => { setLocalWeekAssignments(weekAssignments) }, [weekAssignments])

  const refresh = () => startTransition(() => router.refresh())
  const currentWeekStart = getWeekRange().monday

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUncomplete = async (task: Task, date?: string) => {
    setTogglingId(task.id)
    if (date) {
      setLocalCompletions(prev => prev.filter(c => !(c.task_id === task.id && c.completed_date === date)))
      await uncompleteTaskOnDate(task.id, date)
    } else {
      const period = FREQ_CONFIG[task.frequency]?.period ?? 'all'
      setLocalCompletions(prev => prev.filter(c => {
        if (c.task_id !== task.id) return true
        const today = new Date().toISOString().split('T')[0]
        const year  = new Date().getFullYear()
        const { monday, sunday } = getWeekRange()
        if (period === 'today')  return c.completed_date !== today
        if (period === 'week')   return !(c.completed_date >= monday && c.completed_date <= sunday)
        if (period === 'year')   return !c.completed_date.startsWith(String(year))
        if (period === 'recent') return false
        return false
      }))
      await uncompleteTask(task.id, period)
    }
    setTogglingId(null)
    refresh()
  }

  const handleComplete = async (task: Task, person: string, date?: string) => {
    setTogglingId(task.id)
    const completedDate = date ?? new Date().toISOString().split('T')[0]
    const fake: Completion = { id: 'tmp', task_id: task.id, completed_date: completedDate, completed_by: person }
    setLocalCompletions(prev => [...prev, fake])
    await completeTask(task.id, person, date)
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

  const handleSave = async (data: Omit<Task, 'id'> & { last_done_date?: string }) => {
    const { last_done_date, ...rest } = data
    const payload = {
      title: rest.title, frequency: rest.frequency,
      day_of_week:          rest.day_of_week ?? undefined,
      assigned_to:          rest.assigned_to ?? undefined,
      notes:                rest.notes ?? undefined,
      custom_interval_days: rest.custom_interval_days ?? undefined,
    }
    if (editing) { await updateTask(editing.id, payload); setEditing(null) }
    else         { await createTask({ ...payload, last_done_date }); setShowForm(false) }
    refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Abandonar esta misión permanentemente?')) return
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

      {/* Header RPG */}
      <header className="mb-5">
        <div className="bg-slate-900 rounded-2xl px-6 py-5 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-900 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Swords size={14} className="text-amber-400" />
                <span className="text-amber-400 font-black text-[10px] uppercase tracking-widest">Gremio de Aventureros</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Tablero de Misiones</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                {totalDone} completadas · {totalPending} pendientes
              </p>
            </div>
            <button onClick={() => { setShowForm(true); setEditing(null) }}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0 shadow-lg">
              <Plus size={16} /> Nueva misión
            </button>
          </div>
        </div>
      </header>

      {/* XP bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm px-5 py-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Experiencia del Gremio</span>
          <span className="ml-auto text-sm font-black text-white">{overallPct}%</span>
        </div>
        <div className="bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${overallPct === 100 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`}
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
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

      {/* New quest form */}
      {(showForm && !editing) && (
        <div className="mb-6">
          <TaskForm profiles={profiles} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6 w-fit border border-slate-800">
        {([
          ['pending',  '⚔️ Misiones Activas'],
          ['all',      '📜 Tablero del Gremio'],
          ['calendar', '🗺️ Mapa Semanal'],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── MISIONES ACTIVAS ───────────────────────────────────────────────── */}
      {view === 'pending' && (
        <div className="space-y-8">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <Sparkles size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-slate-400">El tablero está vacío, aventurero</p>
              <p className="text-sm mt-1">Crea tu primera misión con el botón de arriba</p>
            </div>
          )}
          {freqOrder.filter(f => byFreq[f]?.length).map(freq => {
            const cfg       = FREQ_CONFIG[freq]
            const FreqIcon  = cfg.Icon
            const { sunday } = getWeekRange()
            const freqTasks = (byFreq[freq] ?? [])
              .filter(t => {
                if (t.frequency !== 'custom') return true
                const nextDue = getNextDueDate(t, localCompletions)
                return !nextDue || nextDue <= sunday
              })
              .slice().sort((a, b) =>
                freq === 'weekly' ? DAYS.indexOf(a.day_of_week ?? '') - DAYS.indexOf(b.day_of_week ?? '') : 0
              )
            if (freqTasks.length === 0) return null
            const doneCnt = freqTasks.filter(t => isDone(t, localCompletions)).length
            const pct     = freqTasks.length > 0 ? Math.round((doneCnt / freqTasks.length) * 100) : 0
            return (
              <div key={freq}>
                <div className="flex items-center gap-3 mb-3">
                  <FreqIcon size={14} className={cfg.text} />
                  <p className={`text-xs font-black uppercase tracking-widest shrink-0 ${cfg.text}`}>{cfg.plural}</p>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cfg.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 shrink-0">{doneCnt}/{freqTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {freqTasks.map(task => (
                    <div key={task.id} className="relative">
                      {togglingId === task.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 rounded-2xl">
                          <Loader2 size={16} className="animate-spin text-amber-400" />
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

      {/* ── MAPA SEMANAL ──────────────────────────────────────────────────── */}
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

      {/* ── TABLERO DEL GREMIO ────────────────────────────────────────────── */}
      {view === 'all' && (
        <div className="space-y-6">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <p className="font-bold">El tablero del gremio está vacío. Crea la primera misión.</p>
            </div>
          )}
          {freqOrder.filter(f => byFreq[f]?.length).map(freq => {
            const cfg      = FREQ_CONFIG[freq]
            const FreqIcon = cfg.Icon
            return (
              <div key={freq}>
                <div className="flex items-center gap-2 mb-3">
                  <FreqIcon size={14} className={cfg.text} />
                  <p className={`text-xs font-black uppercase tracking-widest ${cfg.text}`}>{cfg.plural}</p>
                </div>
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm divide-y divide-slate-800">
                  {(byFreq[freq] ?? []).map(task => (
                    <div key={task.id}>
                      {editing?.id === task.id ? (
                        <div className="p-3">
                          <TaskForm initial={task} profiles={profiles} onSave={handleSave} onCancel={() => setEditing(null)} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 group">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-200">{task.title}</p>
                            <p className="text-xs text-slate-600">
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
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-900/30 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(task.id)} disabled={deletingId === task.id}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50">
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
