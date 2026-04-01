import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'claudrian1992@gmail.com'

const PROTECTED_ROUTES: { prefix: string; permission: string }[] = [
  { prefix: '/meals',         permission: 'meals'       },
  { prefix: '/recipes',       permission: 'recipes'     },
  { prefix: '/shopping-list', permission: 'shopping'    },
  { prefix: '/finances',      permission: 'finances'    },
  { prefix: '/utilities',     permission: 'utilities'   },
  { prefix: '/services',      permission: 'services'    },
  { prefix: '/restaurants',   permission: 'restaurants' },
  { prefix: '/wishlist',      permission: 'wishlist'    },
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Sin sesión → solo /login
  if (!user && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en /login → al inicio
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user) {
    // /admin solo para el administrador
    if (pathname.startsWith('/admin') && user.email !== ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Rutas con permiso requerido
    const permissions: string[] = user.user_metadata?.permissions ?? []
    const matched = PROTECTED_ROUTES.find(r => pathname.startsWith(r.prefix))
    if (matched && !permissions.includes(matched.permission)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
