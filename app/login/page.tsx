'use client'

import { useState } from 'react'
import { login } from './actions'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Lock, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setLoading(true)
    const res = await login(formData)
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-sky-50 to-rose-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-violet-100 w-full max-w-sm border border-violet-100">

        <div className="flex flex-col items-center mb-8">
          <div className="bg-violet-100 p-4 rounded-2xl mb-4 text-violet-500">
            <LayoutDashboard size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Family<span className="text-violet-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Tu hogar, en un vistazo.</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-violet-100 bg-violet-50/30 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-slate-700 placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-300" size={16} />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 p-3 rounded-xl border border-violet-100 bg-violet-50/30 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-colors text-slate-700"
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 p-3 rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-400 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-violet-100 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}
