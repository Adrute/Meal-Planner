'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldCheck, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { completeTask, uncompleteTask } from './actions'

type Task = {
  id: string
  title: string
  frequency: string
  assigned_to: string | null
  custom_interval_days: number | null
}
type Completion = { task_id: string; completed_date: string; completed_by: string | null }
type Profile = { id: string; display_name: string | null; email: string }
type Group = { type: string; label: string; pending: Task[]; done: Task[] }

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now); monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  return { monday: fmtDate(monday), sunday: fmtDate(sunday) }
}

export default function QuestsWidgetClient({
  groups,
  profiles,
  completions,
  today,
}: {
  groups: Group[]
  profiles: Profile[]
  completions: Completion[]
  today: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const refresh = () => startTransition(() => router.refresh())

  const nonAdminProfiles = profiles.filter(
    p => p.display_name && p.display_name.toLowerCase() !== 'admin'
  )

  const handleComplete = async (task: Task) => {
    setTogglingId(task.id)
    const person = task.assigned_to?.split(',')[0]?.trim() ?? 'N/A'
    await completeTask(task.id, person)
    setTogglingId(null)
    refresh()
  }

  const handleUncomplete = async (task: Task) => {
    setTogglingId(task.id)
    const period = task.frequency === 'daily' ? 'today'
      : task.frequency === 'weekly' ? 'week'
      : task.frequency === 'annual' ? 'year'
      : 'recent'
    await uncompleteTask(task.id, period)
    setTogglingId(null)
    refresh()
  }

  const { monday, sunday } = getWeekRange()
  const year = today.slice(0, 4)

  const totalPending = groups.reduce((s, g) => s + g.pending.length, 0)
  const totalDone = groups.reduce((s, g) => s + g.done.length, 0)
  const total = totalPending + totalDone
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0

  return (
    <div className="bg-white/80 rounded-3xl p-5 border border-lime-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-lime-100 p-2 rounded-xl text-lime-600">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-700">Quests</h2>
            <p className="text-xs text-slate-400">{totalDone} completadas · {totalPending} pendientes</p>
          </div>
        </div>
        <Link href="/tasks" className="text-slate-300 hover:text-lime-500 transition-colors">
          <ArrowRight size={20} />
        </Link>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-400' : 'bg-lime-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">{pct}%</span>
        </div>
      )}

      {total === 0 ? (
        <p className="text-sm text-slate-400 italic">Sin misiones registradas</p>
      ) : totalPending === 0 ? (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm font-bold w-fit">
          <ShieldCheck size={16} /> ¡Todo al día!
        </div>
      ) : (
        <div className="space-y-3">
          {groups.filter(g => g.pending.length > 0).map(group => (
            <div key={group.type}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.pending.slice(0, 4).map(task => (
                  <div key={task.id} className="relative flex items-center gap-1.5 bg-lime-50 border border-lime-100 rounded-xl px-3 py-1.5">
                    {togglingId === task.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                        <Loader2 size={12} className="animate-spin text-lime-500" />
                      </div>
                    )}
                    <button
                      onClick={() => handleComplete(task)}
                      className="shrink-0 text-lime-400 hover:text-lime-600 transition-colors"
                      title="Completar"
                    >
                      <Shield size={14} />
                    </button>
                    <span className="text-xs font-bold text-lime-700">{task.title}</span>
                    {task.assigned_to && (
                      <span className="font-normal text-lime-500 text-xs">· {task.assigned_to.split(',')[0]?.trim()}</span>
                    )}
                  </div>
                ))}
                {group.pending.length > 4 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400">
                    +{group.pending.length - 4} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
