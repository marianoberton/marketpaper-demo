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
    try {
      // First check if user is super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (superAdmin) {
        console.log('Middleware: User is super admin, redirecting to /admin')
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Get user profile to determine role and company
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, company_id, status')
        .eq('id', user.id)
        .single()

      if (profile) {
        console.log('Middleware: Profile found:', profile)
        // Redirect based on role and company
        if (profile.company_id && profile.status === 'active') {
          console.log('Middleware: User has active company, redirecting to /workspace with company_id')
          const workspaceUrl = new URL('/workspace', request.url)
          workspaceUrl.searchParams.set('company_id', profile.company_id)
          return NextResponse.redirect(workspaceUrl)
        } else {
          console.log('Middleware: User needs setup, redirecting to /setup')
          return NextResponse.redirect(new URL('/setup', request.url))
        }
      } else {
        console.log('Middleware: No profile found, redirecting to /setup')
        // User doesn't have a profile, redirect to setup
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    } catch (error) {
      console.error('Middleware: Error checking user status:', error)
      // On error, redirect to setup to let user fix their profile
      return NextResponse.redirect(new URL('/setup', request.url))
    }
  }

  // Define protected routes
  const protectedRoutes = ['/workspace', '/admin']
  const setupRoutes = ['/setup', '/debug-supabase', '/workspace/construccion/debug-upload']

  // Allow access to setup and debug pages even if there are profile issues
  if (setupRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}