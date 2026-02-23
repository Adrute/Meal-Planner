'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { useRouter } from 'next/navigation'
import { ChefHat, Lock, User, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true) // Estado para cambiar de vista
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setLoading(true)

    // Elegimos la acción según el modo
    const action = isLogin ? login : signup
    const res = await action(formData)

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      // Si no hay error, la acción hace redirect, pero por seguridad:
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-emerald-600">
          <div className="bg-emerald-100 p-4 rounded-full mb-3">
            <ChefHat size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Family Meal</h1>
          <p className="text-slate-400 text-sm font-medium">Planifica, cocina, disfruta.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <form action={handleSubmit} className="space-y-4">
          <div>
            {/* EL NUEVO CÓDIGO CORRECTO */}
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Crear Cuenta')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}