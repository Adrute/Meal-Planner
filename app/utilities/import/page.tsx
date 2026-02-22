'use client'

import { useState } from 'react'
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { processMultipleInvoices } from '../actions'
import { useRouter } from 'next/navigation'

export default function ImportInvoicePage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convertimos el FileList a Array para poder manejarlo mejor
      setFiles(Array.from(e.target.files))
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    // Añadimos TODOS los archivos al FormData bajo la misma clave 'pdfs'
    files.forEach(file => {
      formData.append('pdfs', file)
    })

    try {
      const result = await processMultipleInvoices(formData)
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push('/utilities')
      }
    } catch (err: any) {
      setError("Error inesperado en el servidor.")
      setLoading(false)
    }
  }

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
          border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all
          ${files.length > 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
        `}>
          <input 
            type="file" 
            accept="application/pdf" 
            multiple 
            className="hidden" 
            onChange={handleFileChange}
          />
          
          {files.length > 0 ? (
            <>
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{files.length} archivos seleccionados</h3>
              <div className="mt-3 flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
                 {files.map((f, i) => (
                   <span key={i} className="text-xs font-medium bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full shadow-sm">
                     {f.name}
                   </span>
                 ))}
              </div>
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

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            <strong>Atención:</strong> {error}
          </div>
        )}

        <button 
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {loading ? `Procesando ${files.length} facturas...` : 'Procesar Facturas'}
        </button>

      </div>
    </div>
  )
}