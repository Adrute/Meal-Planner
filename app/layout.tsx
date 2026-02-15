import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "./login/actions";
import { UtensilsCrossed, CalendarDays, ShoppingCart, Home, ChefHat, LogOut, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = { title: "Meal Planner", description: "Planificador de comidas" };
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Leer sesión
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('meal_session')?.value
  const user = sessionCookie ? JSON.parse(sessionCookie) : null
  const isAdmin = user?.role === 'admin'

  return (
    <html lang="es" className="h-full bg-slate-50">
      <body className={`${inter.variable} font-sans antialiased h-full text-slate-900 flex`}>
        
        {/* SIDEBAR (Solo Desktop) */}
        {user && (
          <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-emerald-600">
              <ChefHat size={28} />
              <div className="leading-none">
                <span className="font-bold text-lg tracking-tight text-slate-800 block">MealPlanner</span>
                <span className="text-xs text-slate-400 font-medium">Hola, {user.username}</span>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <DesktopNavLink href="/" icon={<Home size={20} />} label="Inicio" />
              <DesktopNavLink href="/planner" icon={<CalendarDays size={20} />} label="Planificador" />
              <DesktopNavLink href="/recipes" icon={<UtensilsCrossed size={20} />} label="Recetario" />
              <DesktopNavLink href="/shopping-list" icon={<ShoppingCart size={20} />} label="Lista de Compra" />
              
              {isAdmin && (
                <DesktopNavLink href="/admin" icon={<Settings size={20} />} label="Administración" />
              )}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <form action={logout}>
                <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
              </form>
            </div>
          </aside>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 ${!user ? 'h-full' : ''}`}>
          <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
            <div className="max-w-full mx-auto w-full">
               {children}
            </div>
          </div>
        </main>

        {/* BOTTOM NAV (Móvil) */}
        {user && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 px-2">
              <MobileNavLink href="/" icon={<Home size={20} />} label="Inicio" />
              <MobileNavLink href="/planner" icon={<CalendarDays size={20} />} label="Plan" />
              <MobileNavLink href="/recipes" icon={<UtensilsCrossed size={20} />} label="Recetas" />
              
              {isAdmin && <MobileNavLink href="/admin" icon={<Settings size={20} />} label="Admin" />}

              {/* NUEVO BOTÓN SALIR MÓVIL */}
              <form action={logout}>
                <button type="submit" className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-red-600 active:text-red-600 px-2 group">
                  <LogOut size={20} className="group-active:scale-95 transition-transform" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">Salir</span>
                </button>
              </form>
            </div>
          </nav>
        )}

      </body>
    </html>
  );
}

// Componentes Auxiliares
function DesktopNavLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group font-medium text-sm">
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-emerald-600 active:text-emerald-700 px-2 group">
      <div className="group-active:scale-95 transition-transform">{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </Link>
  );
}