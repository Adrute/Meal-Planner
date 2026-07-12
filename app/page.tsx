import {
  AlertTriangle, ArrowRight, Utensils, Wallet, BookOpen, Zap, CalendarHeart,
  ShoppingBasket, UtensilsCrossed, Plane, HeartPulse, Gift, Tags, Swords,
} from 'lucide-react'
import QuestsWidgetClient from './tasks/QuestsWidgetClient'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAlerts } from '@/lib/dashboard-alerts'

function getNextDueDateServer(
  task: { custom_interval_days: number | null },
  lastCompletion: string | null,
  today: string,
): string {
  if (!task.custom_interval_days) return today
  if (!lastCompletion) return today
  const d = new Date(lastCompletion + 'T12:00:00')
  d.setDate(d.getDate() + task.custom_interval_days)
  const mtz = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
  return mtz(d)
}

const madridDate = (d: Date = new Date()) =>
  d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })

async function TasksWidget() {
  const supabase = await createClient()
  const today = madridDate()
  // Parse today at noon UTC so getDay()/getDate() are unambiguous on any server timezone
  const todayD = new Date(today + 'T12:00:00')
  const year = todayD.getFullYear()
  const todayDow = todayD.getDay() || 7
  const monday = new Date(todayD); monday.setDate(todayD.getDate() - todayDow + 1)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const monStr = madridDate(monday)
  const sunStr = madridDate(sunday)

  const [{ data: tasks }, { data: completions }, { data: profiles }] = await Promise.all([
    supabase.from('household_tasks')
      .select('id, title, frequency, day_of_week, assigned_to, custom_interval_days')
      .order('frequency').order('title'),
    supabase.from('task_completions')
      .select('task_id, completed_date, completed_by')
      .gte('completed_date', `${year}-01-01`)
      .lte('completed_date', `${year}-12-31`),
    supabase.from('profiles').select('id, display_name, email').order('display_name'),
  ])

  const allTasks = tasks ?? []
  const allComp  = completions ?? []

  type RawTask = { id: string; title: string; frequency: string; assigned_to: string | null; custom_interval_days: number | null }
  type RawComp = { task_id: string; completed_date: string; completed_by: string | null }

  const isDoneTask = (t: RawTask) => {
    const tc = allComp.filter((c: RawComp) => c.task_id === t.id)
    if (t.frequency === 'daily')    return tc.some((c: RawComp) => c.completed_date === today)
    if (t.frequency === 'weekly')   return tc.some((c: RawComp) => c.completed_date >= monStr && c.completed_date <= sunStr)
    if (t.frequency === 'annual')   return tc.some((c: RawComp) => c.completed_date.startsWith(String(year)))
    if (t.frequency === 'punctual') return tc.length > 0
    if (t.frequency === 'custom' && t.custom_interval_days) {
      const last = tc.sort((a: RawComp, b: RawComp) => b.completed_date.localeCompare(a.completed_date))[0]
      if (!last) return false
      const days = Math.floor((Date.now() - new Date(last.completed_date + 'T12:00:00').getTime()) / 86400000)
      return days < t.custom_interval_days
    }
    return false
  }

  const FREQ_LABELS: Record<string, string> = {
    daily: 'Misiones Diarias',
    weekly: 'Misiones Semanales',
    custom: 'Misiones Épicas',
    annual: 'Misiones Legendarias',
    punctual: 'Contratos',
  }

  const freqOrder = ['daily', 'weekly', 'custom', 'annual', 'punctual']

  const groups = freqOrder.map(freq => {
    const freqTasks = allTasks.filter((t: RawTask) => {
      if (t.frequency !== freq) return false
      if (freq === 'punctual') return !isDoneTask(t)
      if (freq === 'custom' && t.custom_interval_days) {
        const lastComp = allComp
          .filter((c: RawComp) => c.task_id === t.id)
          .sort((a: RawComp, b: RawComp) => b.completed_date.localeCompare(a.completed_date))[0]?.completed_date ?? null
        const nextDue = getNextDueDateServer(t, lastComp, today)
        return nextDue <= today
      }
      return true
    })
    const pending = freqTasks.filter((t: RawTask) => !isDoneTask(t))
    const done    = freqTasks.filter((t: RawTask) => isDoneTask(t))
    return { type: freq, label: FREQ_LABELS[freq] ?? freq, pending, done }
  }).filter(g => g.pending.length + g.done.length > 0)

  return (
    <QuestsWidgetClient
      groups={groups}
      profiles={profiles ?? []}
      completions={allComp}
      today={today}
    />
  )
}

const LAUNCHER_ITEMS = [
  { key: 'meals',       href: '/meals',          label: 'Comidas',      icon: Utensils,        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { key: 'finances',    href: '/finances',       label: 'Finanzas',     icon: Wallet,          iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'recipes',     href: '/recipes',        label: 'Recetas',      icon: BookOpen,        iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'utilities',   href: '/utilities',      label: 'Suministros',  icon: Zap,             iconBg: 'bg-lime-100',    iconColor: 'text-lime-600' },
  { key: 'services',    href: '/services',       label: 'Bonos',        icon: CalendarHeart,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { key: 'shopping',    href: '/shopping-list',  label: 'Compra',       icon: ShoppingBasket,  iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'restaurants', href: '/restaurants',    label: 'Restaurantes', icon: UtensilsCrossed, iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'trips',       href: '/trips',          label: 'Viajes',       icon: Plane,           iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { key: 'health',      href: '/health',         label: 'Salud',        icon: HeartPulse,      iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'wishlist',    href: '/wishlist',       label: 'Deseos',       icon: Gift,            iconBg: 'bg-green-100',   iconColor: 'text-green-600' },
  { key: 'ingredients', href: '/ingredients',    label: 'Ingredientes', icon: Tags,            iconBg: 'bg-teal-100',    iconColor: 'text-teal-600' },
  { key: 'tasks',       href: '/tasks',          label: 'Quests',       icon: Swords,          iconBg: 'bg-lime-100',    iconColor: 'text-lime-600' },
]

export const dynamic = 'force-dynamic'

export default async function HomeDashboard() {
  const alerts = await getDashboardAlerts()

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in">

      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Hola, <span className="text-emerald-400">Familia</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Tu resumen del hogar actualizado a hoy.</p>
      </header>

      {/* --- WIDGET: TAREAS / QUESTS --- */}
      <TasksWidget />

      {/* --- AVISOS --- */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 ml-1">
            Avisos
          </p>
          <div className={`grid grid-cols-1 gap-3 ${alerts.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
            {alerts.map((alert, i) => (
              <Link
                key={i}
                href={alert.href}
                className="group flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100/70 hover:border-amber-300 transition-colors"
              >
                <div className="bg-amber-100 group-hover:bg-amber-200 p-2 rounded-xl text-amber-600 shrink-0 transition-colors">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-amber-900">{alert.title}</p>
                  <p className="text-xs text-amber-700/90 leading-relaxed mt-0.5">{alert.message}</p>
                </div>
                <ArrowRight size={16} className="text-amber-400 group-hover:text-amber-600 shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- LAUNCHER --- */}
      <p className="text-sm font-black text-slate-700 mb-3 ml-1">Accesos directos</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {LAUNCHER_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-2.5 py-6 px-2 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-emerald-200 active:scale-95 transition-all"
            >
              <div className={`p-3 rounded-2xl ${item.iconBg} ${item.iconColor} group-hover:scale-105 transition-transform`}>
                <Icon size={22} />
              </div>
              <span className="text-xs md:text-sm font-bold text-slate-700 text-center leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>

    </div>
  )
}
