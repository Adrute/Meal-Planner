import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, TrendingDown, TrendingUp, CalendarDays, Hash,
} from 'lucide-react'
import DetailMonthSelector from './detail-month-selector'
import CategoryDetailUI from './detail-ui'
import { type Category } from '../../constants'

export const dynamic = 'force-dynamic'

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function labelMonth(ymStr: string) {
  if (ymStr === 'all') return 'Todos los meses'
  const [y, m] = ymStr.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${months[parseInt(m) - 1]} ${y}`
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const { month } = await searchParams

  const [{ data: cat }, { data: transactions }, { data: categoriesRaw }] = await Promise.all([
    supabase
      .from('transaction_categories')
      .select('*, transaction_subcategories(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('bank_transactions')
      .select('*')
      .order('fecha_operacion', { ascending: false }),
    supabase
      .from('transaction_categories')
      .select('*, transaction_subcategories(*)')
      .order('name'),
  ])

  if (!cat) notFound()

  const categories: Category[] = categoriesRaw || []
  const allForCat = (transactions || []).filter(t => t.categoria === cat.name)

  // Meses disponibles para esta categoría
  const availableMonths = Array.from(
    new Set(allForCat.map(t => t.fecha_operacion.substring(0, 7)))
  ).sort().reverse()

  const selectedMonth = month || availableMonths[0] || 'all'
  const isAllTime = selectedMonth === 'all'
  const selTx = isAllTime
    ? allForCat
    : allForCat.filter(t => t.fecha_operacion.startsWith(selectedMonth))

  // ── Métricas del período seleccionado ──
  const totalGastos = Math.abs(
    selTx.filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)
  )
  const totalIngresos = selTx.filter(t => t.importe > 0).reduce((s, t) => s + Number(t.importe), 0)
  const nTransacciones = selTx.filter(t => t.importe < 0).length

  // ── Métricas históricas (siempre sobre todos los datos) ──
  const totalHistorico = Math.abs(
    allForCat.filter(t => t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)
  )
  const mediaM = availableMonths.length > 0 ? totalHistorico / availableMonths.length : 0

  // Mes de mayor gasto
  const monthlyTotals = availableMonths.map(m => ({
    month: m,
    total: Math.abs(allForCat.filter(t => t.fecha_operacion.startsWith(m) && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0))
  })).sort((a, b) => b.total - a.total)
  const topMonth = monthlyTotals[0]

  // ── Desglose subcategorías para el período ──
  const subcats = cat.transaction_subcategories || []
  const subcatStats = subcats
    .map((sub: { id: string; name: string }) => {
      const subTotal = Math.abs(
        selTx.filter(t => t.subcategoria === sub.name && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)
      )
      return { name: sub.name, total: subTotal, pct: totalGastos > 0 ? (subTotal / totalGastos) * 100 : 0 }
    })
    .filter((s: { total: number }) => s.total > 0)
    .sort((a: { total: number }, b: { total: number }) => b.total - a.total)

  // Importe sin subcategoría
  const assigned = subcatStats.reduce((s: number, sub: { total: number }) => s + sub.total, 0)
  const unassigned = totalGastos - assigned
  if (unassigned > 0.01 && subcats.length > 0) {
    subcatStats.push({ name: 'Sin subcategoría', total: unassigned, pct: totalGastos > 0 ? (unassigned / totalGastos) * 100 : 0 })
  }

  // ── Evolución mensual para el gráfico (12 meses) ──
  const now = new Date()
  const monthlyEvolution = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - (11 - i), 1)
    const key = ym(d)
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    const total = Math.abs(
      allForCat.filter(t => t.fecha_operacion.startsWith(key) && t.importe < 0).reduce((s, t) => s + Number(t.importe), 0)
    )
    return { label, key, total }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24 md:pb-10 space-y-8 animate-in fade-in">

      {/* HEADER */}
      <header className="space-y-4">
        <Link
          href={`/finances?month=${selectedMonth}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Finanzas
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full shrink-0" style={{ background: cat.color }} />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{cat.name}</h1>
          </div>
          <DetailMonthSelector availableMonths={availableMonths} selectedMonth={selectedMonth} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {isAllTime ? 'Histórico total' : labelMonth(selectedMonth)}
        </p>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Gasto período"
          value={`${totalGastos.toFixed(0)} €`}
          icon={<TrendingDown size={15} className="text-red-400" />}
          valueColor="text-slate-900"
        />
        {totalIngresos > 0 && (
          <StatCard
            label="Ingresos período"
            value={`${totalIngresos.toFixed(0)} €`}
            icon={<TrendingUp size={15} className="text-emerald-500" />}
          />
        )}
        <StatCard
          label="Media/mes"
          value={`${mediaM.toFixed(0)} €`}
          icon={<CalendarDays size={15} className="text-blue-400" />}
          sub={topMonth ? `Punta: ${labelMonth(topMonth.month)}` : undefined}
        />
        <StatCard
          label="Transacciones"
          value={String(nTransacciones)}
          icon={<Hash size={15} className="text-purple-400" />}
          sub={isAllTime ? undefined : `${availableMonths.length} meses con datos`}
        />
      </div>

      {/* DETALLE INTERACTIVO (gráfico + subcats + lista editable) */}
      <CategoryDetailUI
        transactions={selTx}
        availableMonths={availableMonths}
        selectedMonth={selectedMonth}
        categories={categories}
        categoryColor={cat.color}
        subcatStats={subcatStats}
        monthlyEvolution={monthlyEvolution}
      />

    </div>
  )
}

function StatCard({ label, value, icon, sub, valueColor = 'text-slate-900' }: {
  label: string; value: string; icon: React.ReactNode; sub?: string; valueColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
      </div>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      {sub && <p className="text-[10px] font-bold mt-1 text-slate-400">{sub}</p>}
    </div>
  )
}
