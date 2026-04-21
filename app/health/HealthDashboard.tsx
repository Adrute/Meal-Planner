'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Scale, Footprints, Droplets, Plus, Minus, Trash2,
  Loader2, TrendingDown, TrendingUp, Timer, Route, Smile,
} from 'lucide-react'
import {
  addWeightLog, deleteWeightLog,
  addRunningLog, deleteRunningLog,
  upsertHydrationLog, deleteHydrationLog,
} from './actions'
import WeightChart from './WeightChart'
import RunningChart from './RunningChart'
import HydrationChart from './HydrationChart'

type WeightLog     = { id: string; date: string; weight_kg: number; notes: string | null }
type RunningLog    = { id: string; date: string; distance_km: number; duration_minutes: number; feeling: number | null; notes: string | null }
type HydrationLog  = { id: string; date: string; glasses: number }

const FEELING_EMOJI = ['', '😓', '😐', '🙂', '😊', '🔥']
const GLASS_GOAL   = 8
const today        = new Date().toISOString().split('T')[0]

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatPace(minPerKm: number) {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}'${s.toString().padStart(2, '0')}"`
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}min`
}

// ─── Weight section ───────────────────────────────────────────────────────────

function WeightSection({ logs }: { logs: WeightLog[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [date, setDate]     = useState(today)
  const [weight, setWeight] = useState('')
  const [notes, setNotes]   = useState('')
  const [error, setError]   = useState<string | null>(null)
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
  const first   = weights[0]
  const last    = weights[weights.length - 1]
  const diff    = logs.length >= 2 ? +(last - first).toFixed(1) : null

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-rose-50 p-2 rounded-xl text-rose-500"><Scale size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Peso</h2>
        </div>
        <p className="text-xs text-slate-400 ml-[52px]">Registra tu evolución diaria</p>
      </div>

      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Actual',  value: `${last} kg`,  color: 'text-slate-800', Icon: null },
            { label: 'Inicio',  value: `${first} kg`, color: 'text-slate-800', Icon: null },
            {
              label: diff === null ? 'Diferencia' : diff < 0 ? 'Bajada' : diff > 0 ? 'Subida' : 'Sin cambio',
              value: diff !== null ? `${diff > 0 ? '+' : ''}${diff} kg` : '—',
              color: diff === null ? 'text-slate-400' : diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-red-500' : 'text-slate-400',
              Icon: diff === null ? null : diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus,
            },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <div className={`flex items-center gap-1 font-black text-lg ${s.color}`}>
                {s.Icon && <s.Icon size={16} />}{s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="p-6 border-b border-slate-100 space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir registro</p>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
            className="p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="Peso (kg)" step="0.1" min="20" max="300"
            className="w-32 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota (opcional)"
            className="flex-1 min-w-[140px] p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {saving ? 'Guardando...' : 'Añadir registro de peso'}
        </button>
      </form>

      {logs.length >= 2 && (
        <div className="p-6 border-b border-slate-100">
          <WeightChart logs={logs} />
        </div>
      )}

      {logs.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Historial</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {[...logs].reverse().map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 group transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-24 capitalize shrink-0">
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

// ─── Hydration section ────────────────────────────────────────────────────────

function HydrationSection({ logs }: { logs: HydrationLog[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [date, setDate]     = useState(today)
  const [glasses, setGlasses] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const todayLog = logs.find(l => l.date === today)
  const currentGlasses = glasses || todayLog?.glasses || 0

  const handleSet = async (value: number) => {
    if (value < 0) return
    setGlasses(value)
    setSaving(true)
    await upsertHydrationLog(date, value)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  const handleDateChange = (d: string) => {
    setDate(d)
    const existing = logs.find(l => l.date === d)
    setGlasses(existing?.glasses ?? 0)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteHydrationLog(id)
    setDeletingId(null)
    setGlasses(0)
    startTransition(() => router.refresh())
  }

  const avgGlasses = logs.length > 0
    ? (logs.reduce((s, l) => s + l.glasses, 0) / logs.length).toFixed(1)
    : null

  const glassesToShow = date === today ? currentGlasses : (logs.find(l => l.date === date)?.glasses ?? glasses)
  const pct = Math.min((glassesToShow / GLASS_GOAL) * 100, 100)

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-sky-50 p-2 rounded-xl text-sky-500"><Droplets size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Hidratación</h2>
        </div>
        <p className="text-xs text-slate-400 ml-[52px]">Objetivo: {GLASS_GOAL} vasos al día</p>
      </div>

      {logs.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Media diaria', value: avgGlasses ? `${avgGlasses} vasos` : '—' },
            { label: 'Días registrados', value: `${logs.length}` },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <span className="font-black text-lg text-sky-600">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Control de vasos */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Registrar día</p>
          <input type="date" value={date} onChange={e => handleDateChange(e.target.value)} max={today}
            className="p-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-sky-400" />
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl font-black text-sky-600">{glassesToShow}</span>
            <span className="text-sm text-slate-400 font-medium">/ {GLASS_GOAL} vasos</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-sky-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 100 && <p className="text-xs text-emerald-600 font-bold mt-1">¡Objetivo alcanzado! 💧</p>}
        </div>

        {/* Botones +/- */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => handleSet(glassesToShow - 1)} disabled={glassesToShow <= 0 || saving}
            className="w-16 h-14 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-2xl rounded-2xl transition-colors disabled:opacity-40 shrink-0">
            −
          </button>
          <div className="flex items-center justify-center gap-1.5 text-sky-400">
            {saving && <Loader2 size={14} className="animate-spin" />}
            <Droplets size={20} />
          </div>
          <button onClick={() => handleSet(glassesToShow + 1)} disabled={saving}
            className="w-16 h-14 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl rounded-2xl transition-colors disabled:opacity-40 shrink-0">
            +
          </button>
        </div>
      </div>

      {logs.length >= 2 && (
        <div className="p-6 border-b border-slate-100">
          <HydrationChart logs={logs} />
        </div>
      )}

      {logs.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Historial</p>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {[...logs].reverse().map(l => {
              const p = Math.min((l.glasses / GLASS_GOAL) * 100, 100)
              return (
                <div key={l.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-24 capitalize shrink-0">
                    {format(parseISO(l.date), 'd MMM yyyy', { locale: es })}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${p >= 100 ? 'bg-emerald-500' : 'bg-sky-400'}`} style={{ width: `${p}%` }} />
                  </div>
                  <span className="font-bold text-sky-600 text-sm w-14 text-right shrink-0">{l.glasses}/{GLASS_GOAL}</span>
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

// ─── Running section ──────────────────────────────────────────────────────────

function RunningSection({ logs }: { logs: RunningLog[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [date, setDate]       = useState(today)
  const [distance, setDistance] = useState('')
  const [hours, setHours]     = useState('')
  const [minutes, setMinutes] = useState('')
  const [feeling, setFeeling] = useState<number>(3)
  const [notes, setNotes]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const km      = parseFloat(distance)
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

  const totalKm  = logs.reduce((s, l) => s + l.distance_km, 0)
  const avgPace  = logs.length > 0
    ? logs.reduce((s, l) => s + l.duration_minutes / l.distance_km, 0) / logs.length
    : null

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-violet-50 p-2 rounded-xl text-violet-500"><Footprints size={20} /></div>
          <h2 className="font-bold text-xl text-slate-800">Running</h2>
        </div>
        <p className="text-xs text-slate-400 ml-[52px]">Registra tus salidas a correr</p>
      </div>

      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Total km',     value: `${totalKm.toFixed(1)} km`, Icon: Route },
            { label: 'Salidas',      value: `${logs.length}`,           Icon: Footprints },
            { label: 'Ritmo medio',  value: avgPace ? formatPace(avgPace) : '—', Icon: Timer },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <div className="flex items-center gap-1 font-black text-lg text-violet-600">
                <s.Icon size={15} />{s.value}
              </div>
            </div>
          ))}
        </div>
      )}

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
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Smile size={13} /> Sensación:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setFeeling(n)}
                  className={`text-lg transition-transform ${feeling === n ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}>
                  {FEELING_EMOJI[n]}
                </button>
              ))}
            </div>
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota (opcional)"
            className="flex-1 min-w-[140px] p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-violet-400" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {saving ? 'Guardando...' : 'Añadir salida'}
        </button>
      </form>

      {logs.length > 0 && (
        <div className="p-6 border-b border-slate-100">
          <RunningChart logs={logs} />
        </div>
      )}

      {logs.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Historial</p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {[...logs].reverse().map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 group transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 w-20 capitalize shrink-0">
                    {format(parseISO(l.date), 'd MMM yyyy', { locale: es })}
                  </span>
                  <span className="font-black text-violet-600">{l.distance_km} km</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Timer size={11} /> {formatDuration(l.duration_minutes)}
                  </span>
                  <span className="text-xs text-slate-400">{formatPace(l.duration_minutes / l.distance_km)}/km</span>
                  {l.feeling && <span className="text-base">{FEELING_EMOJI[l.feeling]}</span>}
                  {l.notes && <span className="text-xs text-slate-400 italic">{l.notes}</span>}
                </div>
                <button onClick={() => handleDelete(l.id)} disabled={deletingId === l.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg shrink-0">
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function HealthDashboard({
  weightLogs, runningLogs, hydrationLogs,
}: {
  weightLogs: WeightLog[]
  runningLogs: RunningLog[]
  hydrationLogs: HydrationLog[]
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Salud</h1>
        <p className="text-slate-500 font-medium mt-1">Tu seguimiento personal</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeightSection logs={weightLogs} />
        <HydrationSection logs={hydrationLogs} />
        <RunningSection logs={runningLogs} />
      </div>
    </div>
  )
}
