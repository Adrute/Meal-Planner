import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingDown, TrendingUp, ArrowUpDown, CalendarDays, PiggyBank } from 'lucide-react'
import { type Category } from './constants'
import FinancesUI from './finances-ui'
import EvolutionChart from './finances-chart'
import MonthSelector from './month-selector'
import CategoryBreakdown, { type CatStat } from './category-breakdown'
import CategoriesManager from './categories-manager'

export const dynamic = 'force-dynamic'

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function daysInMonth(ymStr: string) {
  const [y, m] = ymStr.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
function labelMonth(ymStr: string) {
  if (ymStr === 'all') return 'Todos los meses'
  const [y, m] = ymStr.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${months[parseInt(m) - 1]} ${y}`
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const now = new Date()
  const defaultMonth = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const selectedMonth = params.month || defaultMonth
  const isAllTime = selectedMonth === 'all'

  const [sy, sm] = isAllTime ? [0, 0] : selectedMonth.split('-').map(Number)
  const compMonth = isAllTime ? '' : ym(new Date(sy, sm - 2, 1))

  const [
    { data: transactions },
    { data: rules },
    { data: categoriesRaw },
  ] = await Promise.all([
    supabase.from('bank_transactions').select('*').order('fecha_operacion', { ascending: false }),
    supabase.from('category_rules').select('*').order('created_at', { ascending: false }),
    supabase.from('transaction_categories').select('*, transaction_subcategories(*)').order('name'),
  ])

  const all = transactions || []
  const categories: Category[] = categoriesRaw || []

  // Meses disponibles
  const availableMonths = Array.from(new Set(all.map(t => t.fecha_operacion.substring(0, 7)))).sort().reverse()

  const selTx  = isAllTime ? all : all.filter(t => t.fecha_operacion.startsWith(selectedMonth))
  const compTx = isAllTime ? [] : all.filter(t => t.fecha_operacion.startsWith(compMonth))

  // ── Métricas globales del mes ──
  const gastos   = Math.abs(selTx.filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
  const ingresos = selTx.filter(t => t.importe > 0).reduce((s, t) => s + Number(t.importe), 0)
  const balance  = ingresos - gastos
  const tasaAhorro  = ingresos > 0 ? (balance / ingresos) * 100 : 0
  const diasMes     = isAllTime ? 0 : daysInMonth(selectedMonth)
  const mesesConDatos = availableMonths.length
  const gastoDiario = isAllTime
    ? (mesesConDatos > 0 ? gastos / mesesConDatos : 0)
    : gastos / diasMes

  const gastosComp = Math.abs(compTx.filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
  const diffGastos = gastosComp > 0 ? ((gastos - gastosComp) / gastosComp) * 100 : 0

  // ── Desglose por categoría con subcategorías ──
  const catStats: CatStat[] = categories
    .filter(c => !c.is_income)
    .map(cat => {
      const cur  = Math.abs(selTx.filter(t => t.categoria === cat.name && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
      const prev = Math.abs(compTx.filter(t => t.categoria === cat.name && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
      const diff = prev > 0 ? ((cur - prev) / prev) * 100 : null
      const pct  = gastos > 0 ? (cur / gastos) * 100 : 0

      // Subcategorías con datos
      const subcats = cat.transaction_subcategories
        .map(sub => {
          const subCur = Math.abs(
            selTx
              .filter(t => t.categoria === cat.name && t.subcategoria === sub.name && t.importe < 0)
              .reduce((s, t) => s + Number(t.importe), 0)
          )
          return { name: sub.name, cur: subCur, pct: cur > 0 ? (subCur / cur) * 100 : 0 }
        })
        .filter(s => s.cur > 0)
        .sort((a, b) => b.cur - a.cur)

      // Importe no asignado a subcategoría
      const assigned = subcats.reduce((s, sub) => s + sub.cur, 0)
      const unassigned = cur - assigned
      if (unassigned > 0.01) {
        subcats.push({ name: 'Sin subcategoría', cur: unassigned, pct: cur > 0 ? (unassigned / cur) * 100 : 0 })
      }

      return { id: cat.id, cat: cat.name, color: cat.color, cur, prev, diff, pct, subcats }
    })
    .filter(c => c.cur > 0)
    .sort((a, b) => b.cur - a.cur)

  // ── Top 5 gastos individuales ──
  const top5 = [...selTx]
    .filter(t => t.importe < 0)
    .sort((a, b) => Number(a.importe) - Number(b.importe))
    .slice(0, 5)

  // ── Evolución 12 meses (excluye mes actual) ──
  const monthlyEvolution = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - (11 - i), 1)
    const key = ym(d)
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    const tx = all.filter(t => t.fecha_operacion.startsWith(key))
    return {
      label, key,
      gastos:   Math.abs(tx.filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)),
      ingresos: tx.filter(t => t.importe > 0).reduce((s, t) => s + Number(t.importe), 0),
    }
  })

  const monthsWithData = monthlyEvolution.filter(m => m.gastos > 0 && m.key !== selectedMonth)
  const mediaGastos = monthsWithData.length > 0
    ? monthsWithData.reduce((s, m) => s + m.gastos, 0) / monthsWithData.length
    : 0

  // ── Evolución de categorías por mes (todas) ──
  const allCatNames = catStats.map(c => c.cat)
  const defaultActiveCats = allCatNames.slice(0, 5)
  const catColors: Record<string, string> = Object.fromEntries(categories.map(c => [c.name, c.color]))

  const catEvolution = monthlyEvolution.map(m => {
    const monthTx = all.filter(t => t.fecha_operacion.startsWith(m.key))
    const entry: Record<string, number | string> = { label: m.label }
    for (const cat of allCatNames) {
      entry[cat] = Math.abs(
        monthTx.filter(t => t.categoria === cat && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)
      )
    }
    return entry
  })

  const hasData = all.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-24 md:pb-10 animate-in fade-in space-y-8">

      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Wallet size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finanzas</h1>
            <p className="text-slate-500 font-medium">Control mensual de gastos del hogar.</p>
          </div>
        </div>
        {hasData && <MonthSelector availableMonths={availableMonths} selectedMonth={selectedMonth} />}
      </header>

      {hasData && (
        <>
          {/* MÉTRICAS */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Resumen · {isAllTime ? 'Histórico total' : labelMonth(selectedMonth)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                label="Gastos totales"
                value={`${gastos.toFixed(0)} €`}
                icon={<TrendingDown size={16} className="text-red-400" />}
                sub={!isAllTime && gastosComp > 0 ? `${diffGastos > 0 ? '▲' : '▼'} ${Math.abs(diffGastos).toFixed(1)}% vs anterior` : undefined}
                subColor={diffGastos > 0 ? 'text-red-500' : 'text-emerald-600'}
              />
              <StatCard label="Ingresos" value={`${ingresos.toFixed(0)} €`} icon={<TrendingUp size={16} className="text-emerald-500" />} />
              <StatCard
                label="Balance"
                value={`${balance >= 0 ? '+' : ''}${balance.toFixed(0)} €`}
                icon={<ArrowUpDown size={16} className="text-blue-400" />}
                valueColor={balance >= 0 ? 'text-emerald-600' : 'text-red-500'}
              />
              <StatCard
                label="Tasa de ahorro"
                value={`${tasaAhorro.toFixed(1)}%`}
                icon={<PiggyBank size={16} className="text-purple-400" />}
                valueColor={tasaAhorro >= 20 ? 'text-emerald-600' : tasaAhorro >= 0 ? 'text-amber-500' : 'text-red-500'}
                sub={tasaAhorro >= 20 ? '✓ Buen ahorro' : tasaAhorro >= 0 ? 'Margen ajustado' : 'Déficit'}
              />
              <StatCard
                label={isAllTime ? 'Gasto/mes medio' : 'Gasto diario'}
                value={`${gastoDiario.toFixed(0)} €`}
                icon={<CalendarDays size={16} className="text-slate-400" />}
                sub={!isAllTime && mediaGastos > 0 ? `Media: ${(mediaGastos / diasMes).toFixed(0)} €/día` : undefined}
              />
            </div>
          </div>

          {/* DESGLOSE CATEGORÍAS + TOP GASTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Gastos por categoría</h3>
              <p className="text-[10px] text-slate-300 mb-5">Haz clic en una categoría para ver el detalle por subcategoría</p>
              <CategoryBreakdown catStats={catStats} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">Top 5 gastos individuales</h3>
              {top5.length === 0
                ? <p className="text-slate-300 text-sm text-center py-8">Sin gastos registrados</p>
                : (
                  <div className="space-y-4">
                    {top5.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-200 w-6 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{t.concepto}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(t.fecha_operacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            {' · '}{t.categoria}{t.subcategoria ? ` · ${t.subcategoria}` : ''}
                          </p>
                        </div>
                        <span className="text-sm font-black text-red-500 shrink-0">{Math.abs(Number(t.importe)).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* COMPARATIVA VS MES ANTERIOR */}
          {!isAllTime && compTx.length > 0 && catStats.some(c => c.diff !== null) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
                Comparativa vs {labelMonth(compMonth)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catStats.filter(c => c.diff !== null).map(c => (
                  <div key={c.cat} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{c.cat}</p>
                    </div>
                    <p className="text-base font-black text-slate-800">{c.cur.toFixed(0)} €</p>
                    <p className="text-xs text-slate-400">{c.prev.toFixed(0)} € anterior</p>
                    <p className={`text-xs font-black mt-1 ${c.diff! > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {c.diff! > 0 ? '▲ +' : '▼ '}{c.diff!.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GRÁFICOS */}
          <EvolutionChart
            monthlyData={monthlyEvolution}
            catEvolution={catEvolution}
            allCats={allCatNames}
            defaultActiveCats={defaultActiveCats}
            catColors={catColors}
            mediaGastos={mediaGastos}
          />
        </>
      )}

      {/* MOVIMIENTOS */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Movimientos</p>
        <div className="space-y-4">
          <CategoriesManager categories={categories} />
          <FinancesUI
            transactions={selTx}
            rules={rules || []}
            categories={categories}
          />
        </div>
      </div>

    </div>
  )
}

function StatCard({ label, value, icon, sub, valueColor = 'text-slate-900', subColor = 'text-slate-400' }: {
  label: string; value: string; icon: React.ReactNode
  sub?: string; valueColor?: string; subColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
      </div>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      {sub && <p className={`text-[10px] font-bold mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}
