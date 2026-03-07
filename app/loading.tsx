import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-100">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  )
}