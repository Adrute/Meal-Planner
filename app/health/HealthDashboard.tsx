'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Scale, Footprints, Plus, Trash2, Loader2, TrendingDown, TrendingUp, Minus, Timer, Route, Smile } from 'lucide-react'
import { addWeightLog, deleteWeightLog, addRunningLog, deleteRunningLog } from './actions'
import WeightChart from './WeightChart'
import RunningChart from './RunningChart'

type WeightLog = { id: string; date: string; weight_kg: number; notes: string | null }
type RunningLog = { id: string; date: string; distance_km: number; duration_minutes: number; feeling: number | null; notes: string | null }

const FEELING_EMOJI = ['', '😓', '😐', '🙂', '😊', '🔥']
const today = new Date().toISOString().split('T')[0]

// ─── Weight section ───────────────────────────────────────────────────────────

function WeightSection({ logs }: { logs: WeightLog[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const kg = parseFloat(weight)
    if (!date || isNaN(kg) || kg <= 0) { setError('Introduce una fecha y un peso válido'); return }
    setSaving(true); setError(null)
    const res = await addWeightLog(date, kg, notes || undefined)
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    setWeight(''); setNotes('')
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteWeightLog(id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const weights = logs.map(l => l.weight_kg)
  const first = weights[0]
  const last = weights[weights.length - 1]
  const diff = logs.length >= 2 ? last - first : null

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-rose-50 p-2 rounded-xl text-rose-500"><Scale size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Peso</h2>
        </div>
        <p className="text-xs text-slate-400 ml-[52px]">Registra tu evolución diaria</p>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Actual', value: `${last} kg` },
            { label: 'Inicio', value: `${first} kg` },
            {
              label: diff !== null ? (diff < 0 ? 'Bajada' : diff > 0 ? 'Subida' : 'Sin cambio') : 'Diferencia',
              value: diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : '—',
              icon: diff !== null ? (diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus) : null,
              color: diff !== null ? (diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-red-500' : 'text-slate-400') : 'text-slate-400',
            },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <div className={`flex items-center gap-1 font-black text-lg ${s.color ?? 'text-slate-800'}`}>
                {s.icon && <s.icon size={16} />}
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfica */}
      <div className="p-6 border-b border-slate-100">
        <WeightChart logs={logs} />
      </div>

      {/* Formulario */}
      <form onSubmit={handleAdd} className="p-6 border-b border-slate-100 space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir registro</p>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="Peso (kg)" step="0.1" min="20" max="300"
            className="w-32 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Nota (opcional)"
            className="flex-1 min-w-[160px] p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Añadir
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>

      {/* Historial */}
      {logs.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Historial</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...logs].reverse().map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-20 capitalize">
                    {format(parseISO(l.date), 'd MMM yyyy', { locale: es })}
                  </span>
                  <span className="font-black text-slate-800">{l.weight_kg} kg</span>
                  {l.notes && <span className="text-xs text-slate-400 italic">{l.notes}</span>}
                </div>
                <button onClick={() => handleDelete(l.id)} disabled={deletingId === l.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg">
                  {deletingId === l.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Running section ──────────────────────────────────────────────────────────

function RunningSection({ logs }: { logs: RunningLog[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [date, setDate] = useState(today)
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [feeling, setFeeling] = useState<number>(3)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const km = parseFloat(distance)
    const totalMin = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')
    if (!date || isNaN(km) || km <= 0 || totalMin <= 0) {
      setError('Introduce fecha, distancia y duración válidas'); return
    }
    setSaving(true); setError(null)
    const res = await addRunningLog({ date, distance_km: km, duration_minutes: totalMin, feeling, notes: notes || undefined })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    setDistance(''); setHours(''); setMinutes(''); setNotes(''); setFeeling(3)
    startTransition(() => router.refresh())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteRunningLog(id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const totalKm = logs.reduce((s, l) => s + l.distance_km, 0)
  const totalRuns = logs.length
  const avgPace = logs.length > 0
    ? logs.reduce((s, l) => s + l.duration_minutes / l.distance_km, 0) / logs.length
    : null

  function formatPace(minPerKm: number) {
    const m = Math.floor(minPerKm)
    const s = Math.round((minPerKm - m) * 60)
    return `${m}'${s.toString().padStart(2, '0')}"`
  }

  function formatDuration(mins: number) {
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}min`
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-violet-50 p-2 rounded-xl text-violet-500"><Footprints size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Running</h2>
        </div>
        <p className="text-xs text-slate-400 ml-[52px]">Registra tus salidas a correr</p>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Total km', value: `${totalKm.toFixed(1)} km`, icon: Route, color: 'text-violet-600' },
            { label: 'Salidas', value: `${totalRuns}`, icon: Footprints, color: 'text-violet-600' },
            { label: 'Ritmo medio', value: avgPace ? formatPace(avgPace) : '—', icon: Timer, color: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <div className={`flex items-center gap-1 font-black text-lg ${s.color}`}>
                <s.icon size={15} />
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfica */}
      <div className="p-6 border-b border-slate-100">
        <RunningChart logs={logs} />
      </div>

      {/* Formulario */}
      <form onSubmit={handleAdd} className="p-6 border-b border-slate-100 space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir salida</p>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <input type="number" value={distance} onChange={e => setDistance(e.target.value)}
            placeholder="Km" step="0.01" min="0.1"
            className="w-24 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <div className="flex items-center gap-1">
            <input type="number" value={hours} onChange={e => setHours(e.target.value)}
              placeholder="h" min="0" max="10"
              className="w-16 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400 text-center" />
            <span className="text-slate-400 text-sm font-bold">:</span>
            <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)}
              placeholder="min" min="0" max="59"
              className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400 text-center" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Smile size={13} /> Cómo fue:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setFeeling(n)}
                  className={`text-lg transition-transform ${feeling === n ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}>
                  {FEELING_EMOJI[n]}
                </button>
              ))}
            </div>
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Nota (opcional)"
            className="flex-1 min-w-[160px] p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Añadir
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>

      {/* Historial */}
      {logs.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Historial</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {[...logs].reverse().map(l => {
              const pace = l.duration_minutes / l.distance_km
              return (
                <div key={l.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 w-20 capitalize shrink-0">
                      {format(parseISO(l.date), 'd MMM yyyy', { locale: es })}
                    </span>
                    <span className="font-black text-violet-600">{l.distance_km} km</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Timer size={11} /> {formatDuration(l.duration_minutes)}
                    </span>
                    <span className="text-xs text-slate-400">{formatPace(pace)}/km</span>
                    {l.feeling && <span className="text-base">{FEELING_EMOJI[l.feeling]}</span>}
                    {l.notes && <span className="text-xs text-slate-400 italic">{l.notes}</span>}
                  </div>
                  <button onClick={() => handleDelete(l.id)} disabled={deletingId === l.id}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0">
                    {deletingId === l.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function HealthDashboard({ weightLogs, runningLogs }: { weightLogs: WeightLog[]; runningLogs: RunningLog[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Salud</h1>
        <p className="text-slate-500 font-medium mt-1">Tu seguimiento personal</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeightSection logs={weightLogs} />
        <RunningSection logs={runningLogs} />
      </div>
    </div>
  )
}
