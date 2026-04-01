import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import AppNavigation from '@/components/AppNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hogar | Panel de Control',
  description: 'Gestión integral de la familia, comidas y finanzas',
}

const ADMIN_EMAIL = 'claudrian1992@gmail.com'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let permissions: string[] = []
  let displayName = ''
  if (user) {
    const { data: profile } = await supabase.rpc('get_my_profile')
    permissions = (profile as any)?.[0]?.permissions ?? []
    displayName = (profile as any)?.[0]?.display_name || user.email || ''
  }

  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {user ? (
          <div className="flex min-h-screen">
            <AppNavigation
              permissions={permissions}
              isAdmin={user.email === ADMIN_EMAIL}
              displayName={displayName}
            />
            <main className="flex-1 h-screen overflow-y-auto">
              {children}
            </main>
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
