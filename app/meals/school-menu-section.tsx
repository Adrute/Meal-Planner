'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Upload, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react'
import { saveSchoolMenuItems, type SchoolMenuItem } from './actions'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type ParsedItem = {
  date: string
  first_course: string
  second_course: string
  dessert: string
}

function groupByWeek(items: SchoolMenuItem[]) {
  const weeks: Record<string, SchoolMenuItem[]> = {}
  for (const item of items) {
    const d = parseISO(item.date)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = format(monday, 'yyyy-MM-dd')
    if (!weeks[key]) weeks[key] = []
    weeks[key].push(item)
  }
  return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b))
}

export default function SchoolMenuSection({ items }: { items: SchoolMenuItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('El archivo debe ser un PDF')
      return
    }
    setError(null)
    setParsed(null)
    setSavedOk(false)
    setIsParsing(true)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/parse-school-menu', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Error al procesar el PDF')
      } else {
        setParsed(data.menu ?? [])
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSave = () => {
    if (!parsed) return
    startSaveTransition(async () => {
      await saveSchoolMenuItems(parsed)
      setParsed(null)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
      router.refresh()
    })
  }

  const weeks = groupByWeek(items)

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><GraduationCap size={20} /></div>
          <div className="text-left">
            <h2 className="font-bold text-slate-800">Menú del colegio</h2>
            <p className="text-xs text-slate-400">
              {items.length > 0 ? `${items.length} días importados` : 'Importa el PDF mensual del comedor escolar'}
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-5">

          {/* Upload area */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {isParsing ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <p className="text-sm font-medium">Leyendo menú con IA...</p>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">Arrastra el PDF o haz clic para seleccionarlo</p>
                <p className="text-xs text-slate-400 mt-1">Menú mensual del comedor escolar</p>
                <label className="mt-3 inline-block cursor-pointer bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                  Seleccionar PDF
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {savedOk && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 text-sm font-medium">
              <Check size={16} />
              Menú guardado correctamente
            </div>
          )}

          {/* Preview parsed menu */}
          {parsed && parsed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Vista previa — {parsed.length} días detectados
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Día</th>
                      <th className="px-4 py-3">1er plato</th>
                      <th className="px-4 py-3">2º plato</th>
                      <th className="px-4 py-3">Postre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map(item => (
                      <tr key={item.date} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                          {format(parseISO(item.date), 'EEE d MMM', { locale: es })}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{item.first_course}</td>
                        <td className="px-4 py-2.5 text-slate-600">{item.second_course}</td>
                        <td className="px-4 py-2.5 text-slate-400">{item.dessert}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isSaving ? 'Guardando...' : 'Guardar en la app'}
              </button>
            </div>
          )}

          {/* Existing saved menu */}
          {weeks.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Menú guardado</p>
              {weeks.map(([weekStart, weekItems]) => (
                <div key={weekStart}>
                  <p className="text-xs font-bold text-slate-500 mb-2 capitalize">
                    Semana del {format(parseISO(weekStart), "d 'de' MMMM", { locale: es })}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {weekItems
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(item => (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 capitalize">
                            {format(parseISO(item.date), 'EEEE', { locale: es })}
                          </p>
                          <p className="text-xs text-slate-700 font-medium leading-tight">{item.first_course}</p>
                          <p className="text-xs text-slate-500 leading-tight mt-1">{item.second_course}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.dessert}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
