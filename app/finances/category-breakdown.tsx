'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

type SubcatStat = { name: string; cur: number; pct: number }
export type CatStat = {
  id: string
  cat: string
  color: string
  cur: number
  prev: number
  diff: number | null
  pct: number
  subcats: SubcatStat[]
}

export default function CategoryBreakdown({ catStats }: { catStats: CatStat[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (catStats.length === 0) {
    return <p className="text-slate-300 text-sm text-center py-8">Sin gastos registrados</p>
  }

  return (
    <div className="space-y-1">
      {catStats.map(c => (
        <div key={c.cat}>
          <div className="flex items-center gap-1 py-1 rounded-lg px-1">

            {/* Chevron para expandir subcategorías inline */}
            {c.subcats.length > 0 ? (
              <button
                onClick={() => setExpanded(expanded === c.cat ? null : c.cat)}
                className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors shrink-0"
              >
                <ChevronRight
                  size={13}
                  className={`transition-transform duration-150 ${expanded === c.cat ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="w-[17px] shrink-0" />
            )}

            {/* Link al detalle */}
            <Link
              href={`/finances/categoria/${c.id}`}
              className="flex items-center gap-2 flex-1 min-w-0 py-0.5 hover:bg-slate-50 rounded-lg px-1 transition-colors group"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-sm font-bold text-slate-700 flex-1 text-left truncate group-hover:text-blue-600 transition-colors">{c.cat}</span>
              {c.diff !== null && (
                <span className={`text-[10px] font-black ${c.diff > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                  {c.diff > 0 ? '▲' : '▼'} {Math.abs(c.diff).toFixed(0)}%
                </span>
              )}
              <span className="text-sm font-black text-slate-800 w-20 text-right shrink-0">{c.cur.toFixed(0)} €</span>
              <span className="text-[10px] text-slate-400 w-8 text-right shrink-0">{c.pct.toFixed(0)}%</span>
            </Link>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-0.5 mx-1">
            <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
          </div>

          {expanded === c.cat && (
            <div className="ml-5 mb-2 mt-1 space-y-1 border-l-2 pl-3" style={{ borderColor: c.color + '40' }}>
              {c.subcats.map(sub => (
                <div key={sub.name} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs text-slate-500 flex-1">{sub.name}</span>
                  <span className="text-xs font-bold text-slate-700 w-20 text-right">{sub.cur.toFixed(0)} €</span>
                  <span className="text-[10px] text-slate-400 w-8 text-right">{sub.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
