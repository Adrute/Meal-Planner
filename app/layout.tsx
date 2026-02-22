import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "./login/actions";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Wallet, 
  Zap, 
  Settings, 
  LogOut,
  Command
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = { title: "Home OS", description: "Gestión integral del hogar" };
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('meal_session')?.value
  const user = sessionCookie ? JSON.parse(sessionCookie) : null
  const isAdmin = user?.role === 'admin'

  return (
    <html lang="es" className="h-full bg-slate-50">
      <body className={`${inter.variable} font-sans antialiased h-full text-slate-900 flex`}>
        
        {/* SIDEBAR (Solo PC) - TEMA CLARO */}
        {user && (
          <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 h-screen sticky top-0 z-50">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-slate-800">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <Command size={24} />
              </div>
              <div className="leading-none">
                <span className="font-black text-lg tracking-tight block">Home OS</span>
                <span className="text-xs text-slate-500 font-medium">{user.username}</span>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                <DesktopNavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              </div>

              <div>
                <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Módulos</h4>
                <div className="space-y-1">
                  <DesktopNavLink href="/planner" icon={<UtensilsCrossed size={20} />} label="Comidas" />
                  <DesktopNavLink href="/finances" icon={<Wallet size={20} />} label="Finanzas" />
                  <DesktopNavLink href="/utilities" icon={<Zap size={20} />} label="Suministros" />
                </div>
              </div>

              {isAdmin && (
                <div>
                  <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Sistema</h4>
                  <div className="space-y-1">
                    <DesktopNavLink href="/admin" icon={<Settings size={20} />} label="Configuración" />
                  </div>
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <form action={logout}>
                <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
              </form>
            </div>
          </aside>
        )}

        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 ${!user ? 'h-full' : ''}`}>
          <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
            <div className="max-w-full mx-auto w-full">
               {children}
            </div>
          </div>
        </main>

        {/* BOTTOM NAV (Móvil) - TEMA CLARO */}
        {user && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white text-slate-400 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] border-t border-slate-100">
            <div className="flex justify-around items-center h-16 px-1">
              <MobileNavLink href="/" icon={<LayoutDashboard size={20} />} label="Inicio" />
              <MobileNavLink href="/planner" icon={<UtensilsCrossed size={20} />} label="Comidas" />
              <MobileNavLink href="/finances" icon={<Wallet size={20} />} label="Finanzas" />
              <MobileNavLink href="/utilities" icon={<Zap size={20} />} label="Hogar" />
              
              <form action={logout} className="h-full">
                <button type="submit" className="flex flex-col items-center justify-center w-full h-full gap-1 px-3 hover:text-red-500 active:text-red-600 transition-colors">
                  <LogOut size={20} />
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

function DesktopNavLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group font-bold text-sm">
      <span className="group-hover:scale-110 transition-all">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-full h-full gap-1 px-3 hover:text-emerald-600 active:text-emerald-700 transition-colors">
      <div>{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </Link>
  );
}