import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('meal_session')?.value
  const path = request.nextUrl.pathname

  // 1. Si es ruta pública (login), dejar pasar
  if (path === '/login') {
    return NextResponse.next()
  }

  // 2. Si no hay sesión, redirigir a Login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Protección de Admin
  if (path.startsWith('/admin')) {
    const user = JSON.parse(session)
    if (user.role !== 'admin') {
      // Si no es admin, redirigir a Home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}