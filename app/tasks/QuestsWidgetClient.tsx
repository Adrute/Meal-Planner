'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Swords, Shield, Gem, Crown, ScrollText,
  ShieldCheck, Loader2, ArrowRight, Plus,
} from 'lucide-react'
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

const FREQ_STYLE: Record<string, {
  Icon: React.ElementType
  chip: string
  taskBg: string
  taskText: string
  taskBorder: string
  checkHover: string
  doneBadge: string
}> = {
  daily: {
    Icon: Swords,
    chip: 'bg-sky-50 text-sky-700',
    taskBg: 'bg-sky-50',
    taskText: 'text-sky-700',
    taskBorder: 'border-sky-100',
    checkHover: 'hover:text-sky-600',
    doneBadge: 'bg-sky-100 text-sky-600',
  },
  weekly: {
    Icon: Shield,
    chip: 'bg-violet-50 text-violet-700',
    taskBg: 'bg-violet-50',
    taskText: 'text-violet-700',
    taskBorder: 'border-violet-100',
    checkHover: 'hover:text-violet-600',
    doneBadge: 'bg-violet-100 text-violet-600',
  },
  custom: {
    Icon: Gem,
    chip: 'bg-amber-50 text-amber-700',
    taskBg: 'bg-amber-50',
    taskText: 'text-amber-700',
    taskBorder: 'border-amber-100',
    checkHover: 'hover:text-amber-600',
    doneBadge: 'bg-amber-100 text-amber-600',
  },
  annual: {
    Icon: Crown,
    chip: 'bg-rose-50 text-rose-700',
    taskBg: 'bg-rose-50',
    taskText: 'text-rose-700',
    taskBorder: 'border-rose-100',
    checkHover: 'hover:text-rose-600',
    doneBadge: 'bg-rose-100 text-rose-600',
  },
  punctual: {
    Icon: ScrollText,
    chip: 'bg-orange-50 text-orange-700',
    taskBg: 'bg-orange-50',
    taskText: 'text-orange-700',
    taskBorder: 'border-orange-100',
    checkHover: 'hover:text-orange-600',
    doneBadge: 'bg-orange-100 text-orange-600',
  },
}

const MAX_PENDING = 5
const MAX_DONE_SHOWN = 2

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
  const [pickingId, setPickingId] = useState<string | null>(null)

  const refresh = () => startTransition(() => router.refresh())

  const nonAdminProfiles = profiles.filter(
    p => p.display_name && p.display_name.toLowerCase() !== 'admin'
  )

  const handleComplete = async (task: Task, person: string) => {
    setPickingId(null)
    setTogglingId(task.id)
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

  const totalPending = groups.reduce((s, g) => s + g.pending.length, 0)
  const totalDone = groups.reduce((s, g) => s + g.done.length, 0)
  const total = totalPending + totalDone
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0

  return (
    <div className="bg-white/80 rounded-3xl p-6 md:p-8 border border-lime-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-lime-100 p-2.5 rounded-xl text-lime-600">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-700">Quests</h2>
            <p className="text-xs text-slate-400">{totalDone} completadas · {totalPending} pendientes</p>
          </div>
        </div>
        <Link href="/tasks" className="text-slate-300 hover:text-lime-500 transition-colors">
          <ArrowRight size={20} />
        </Link>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-3 mb-5">
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
        <div className="space-y-4">
          {groups.map(group => {
            const style = FREQ_STYLE[group.type] ?? FREQ_STYLE.custom
            const GroupIcon = style.Icon
            const visiblePending = group.pending.slice(0, MAX_PENDING)
            const extraCount = group.pending.length - MAX_PENDING
            const visibleDone = group.done.slice(0, MAX_DONE_SHOWN)
            const allDone = group.pending.length === 0 && group.done.length > 0

            return (
              <div key={group.type}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ${style.chip}`}>
                    <GroupIcon size={10} />
                    {group.label}
                  </span>
                  {allDone && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${style.doneBadge}`}>
                      <ShieldCheck size={10} /> Completado
                    </span>
                  )}
                </div>

                {group.pending.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    {visiblePending.map(task => (
                      <div key={task.id} className="relative">
                        {pickingId === task.id ? (
                          <div className={`flex items-center gap-1 ${style.taskBg} border ${style.taskBorder} rounded-xl px-2 py-1.5`}>
                            {nonAdminProfiles.map(p => (
                              <button
                                key={p.id}
                                onClick={() => handleComplete(task, p.display_name!)}
                                className={`text-xs font-bold px-2 py-0.5 rounded-lg ${style.taskBg} ${style.taskText} hover:opacity-80 transition-opacity`}
                              >
                                {p.display_name}
                              </button>
                            ))}
                            <button
                              onClick={() => handleComplete(task, 'N/A')}
                              className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 hover:opacity-80 transition-opacity"
                            >
                              N/A
                            </button>
                            <button
                              onClick={() => setPickingId(null)}
                              className="text-slate-300 hover:text-slate-500 ml-1 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`relative flex items-center gap-1.5 ${style.taskBg} border ${style.taskBorder} rounded-xl px-3 py-1.5`}
                          >
                            {togglingId === task.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                                <Loader2 size={12} className="animate-spin text-slate-400" />
                              </div>
                            )}
                            <button
                              onClick={() => setPickingId(task.id)}
                              className={`shrink-0 text-slate-300 ${style.checkHover} transition-colors`}
                              title="Completar"
                            >
                              <Shield size={13} />
                            </button>
                            <span className={`text-xs font-bold ${style.taskText}`}>{task.title}</span>
                            {task.assigned_to && (
                              <span className={`font-normal text-xs opacity-60 ${style.taskText}`}>
                                · {task.assigned_to.split(',')[0]?.trim()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <Link
                        href="/tasks"
                        className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Plus size={10} /> {extraCount} más
                      </Link>
                    )}
                  </div>
                )}

                {visibleDone.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {visibleDone.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 opacity-60"
                      >
                        <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-400 line-through">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
