import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: The `auth.getUser()` method must be called to refresh the session.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If user is logged in and tries to access login, register, or the root page, redirect them
  if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    // Check if the user is a super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (superAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // For regular users, redirect to the main page, which handles company selection.
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Define protected routes
  const protectedRoutes = ['/workspace', '/admin', '/setup', '/fix-user']

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
} 