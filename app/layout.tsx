import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Home, Utensils, ShoppingBasket, Wallet, Zap, CalendarHeart, LogOut, BookOpen } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hogar | Panel de Control',
  description: 'Gestión integral de la familia, comidas y finanzas',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Verificamos la sesión con Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Función real para cerrar sesión
  async function signOut() {
    'use server'
    const supabaseServer = await createClient()
    await supabaseServer.auth.signOut()
    redirect('/login')
  }

  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>

        {user ? (
          <div className="flex min-h-screen">

            {/* --- MENÚ LATERAL (TEMA CLARO) --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
              <div className="p-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mi<span className="text-emerald-500">Hogar</span></h2>
              </div>

              <nav className="flex-1 px-4 space-y-2">
                <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <Home size={20} /> <span>Inicio</span>
                </Link>
                <Link href="/meals" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <Utensils size={20} /> <span>Comidas</span>
                </Link>
                <Link href="/recipes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <BookOpen size={20} /> <span>Recetas</span>
                </Link>
                <Link href="/shopping-list" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <ShoppingBasket size={20} /> <span>Compra</span>
                </Link>
                <Link href="/finances" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <Wallet size={20} /> <span>Finanzas</span>
                </Link>
                <Link href="/utilities" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <Zap size={20} /> <span>Suministros</span>
                </Link>
                <Link href="/services" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors font-medium">
                  <CalendarHeart size={20} /> <span>Bonos</span>
                </Link>
              </nav>

              <div className="p-4 border-t border-slate-100">
                {/* Formulario que ejecuta el cierre de sesión */}
                <form action={signOut}>
                  <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-left">
                    <LogOut size={18} /> <span className="truncate">Cerrar Sesión</span>
                  </button>
                </form>
              </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 h-screen overflow-y-auto pb-20 md:pb-0">
              {children}
            </main>

            {/* --- MENÚ MÓVIL CLARO --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between items-center px-2 py-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] overflow-x-auto gap-1">
              <Link href="/" className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-emerald-500 transition-colors">
                <Home size={20} />
                <span className="text-[9px] font-bold mt-1">Inicio</span>
              </Link>
              <Link href="/meals" className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-orange-500 transition-colors">
                <Utensils size={20} />
                <span className="text-[9px] font-bold mt-1">Comidas</span>
              </Link>
              <Link href="/finances" className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-blue-500 transition-colors">
                <Wallet size={20} />
                <span className="text-[9px] font-bold mt-1">Finanzas</span>
              </Link>
              <Link href="/utilities" className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-yellow-500 transition-colors">
                <Zap size={20} />
                <span className="text-[9px] font-bold mt-1">Luz/Gas</span>
              </Link>
              <Link href="/services" className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-emerald-500 transition-colors">
                <CalendarHeart size={20} />
                <span className="text-[9px] font-bold mt-1">Bonos</span>
              </Link>
              
              {/* Botón de Cerrar Sesión Móvil */}
              <form action={signOut} className="flex flex-col items-center p-2 min-w-[50px] text-slate-400 hover:text-red-500 transition-colors">
                <button type="submit" className="flex flex-col items-center outline-none">
                  <LogOut size={20} />
                  <span className="text-[9px] font-bold mt-1">Salir</span>
                </button>
              </form>
            </nav>

          </div>
        ) : (
          <main className="min-h-screen flex items-center justify-center">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}