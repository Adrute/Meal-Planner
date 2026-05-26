'use client'

import { useState } from 'react'
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { processInvoice } from '../actions'
import { useRouter } from 'next/navigation'

type FileStatus = {
  status: 'pending' | 'processing' | 'ok' | 'error'
  error?: string
}

export default function ImportInvoicePage() {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<Record<number, FileStatus>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      setFiles(selected)
      const initial: Record<number, FileStatus> = {}
      selected.forEach((_, i) => { initial[i] = { status: 'pending' } })
      setProgress(initial)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setLoading(true)

    let hasErrors = false
    for (let i = 0; i < files.length; i++) {
      setProgress(prev => ({ ...prev, [i]: { status: 'processing' } }))
      const formData = new FormData()
      formData.append('pdf', files[i])
      try {
        const result = await processInvoice(formData)
        if (result.error) {
          setProgress(prev => ({ ...prev, [i]: { status: 'error', error: result.error } }))
          hasErrors = true
        } else {
          setProgress(prev => ({ ...prev, [i]: { status: 'ok' } }))
        }
      } catch {
        setProgress(prev => ({ ...prev, [i]: { status: 'error', error: 'Error inesperado' } }))
        hasErrors = true
      }
    }

    setLoading(false)
    if (!hasErrors) {
      router.push('/utilities')
    }
  }

  const isProcessed = (i: number) => progress[i]?.status === 'ok' || progress[i]?.status === 'error'
  const allDone = files.length > 0 && files.every((_, i) => isProcessed(i))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/utilities" className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Importación Masiva</h1>
          <p className="text-slate-500 font-medium">Puedes seleccionar varias facturas de golpe.</p>
        </div>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">

        <label className={`
          border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all
          ${files.length > 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
        `}>
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />

          {files.length > 0 ? (
            <>
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-3">
                <FileText size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{files.length} archivos seleccionados</h3>
              <p className="text-xs text-slate-400 mt-1">Haz clic para cambiar la selección</p>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-full shadow-sm text-slate-400 mb-4">
                <UploadCloud size={32} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-1">Arrastra tus PDFs aquí</h3>
              <p className="text-slate-500 text-sm">O haz clic para seleccionar varios archivos</p>
            </>
          )}
        </label>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            {files.map((file, i) => {
              const s = progress[i]
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  s?.status === 'ok'         ? 'bg-emerald-50 border-emerald-100' :
                  s?.status === 'error'      ? 'bg-red-50 border-red-100' :
                  s?.status === 'processing' ? 'bg-slate-50 border-slate-200' :
                                               'bg-slate-50 border-slate-100'
                }`}>
                  <div className="shrink-0">
                    {!s || s.status === 'pending'    ? <FileText size={16} className="text-slate-400" /> : null}
                    {s?.status === 'processing'      ? <Loader2 size={16} className="animate-spin text-amber-500" /> : null}
                    {s?.status === 'ok'              ? <CheckCircle2 size={16} className="text-emerald-500" /> : null}
                    {s?.status === 'error'           ? <AlertCircle size={16} className="text-red-500" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${s?.status === 'ok' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {file.name}
                    </p>
                    {s?.status === 'error' && s.error && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">{s.error}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {s?.status === 'pending' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendiente</span>
                    )}
                    {s?.status === 'ok' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Listo</span>
                    )}
                    {s?.status === 'error' && (
                      <X size={14} className="text-red-400" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {allDone && files.some((_, i) => progress[i]?.status === 'error') && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm font-medium">
            <AlertCircle size={16} />
            Algunos ficheros no pudieron procesarse. Revisa los errores arriba.
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {loading ? 'Procesando facturas...' : 'Procesar Facturas'}
        </button>

      </div>
    </div>
  )
}
