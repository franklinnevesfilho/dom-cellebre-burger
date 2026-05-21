import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = ['/admin', '/employee']
const AUTH_PATHS = ['/login']

function redirectTo(request: NextRequest, pathname: string, error?: string) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = pathname

  if (error) {
    redirectUrl.searchParams.set('error', error)
  } else {
    redirectUrl.searchParams.delete('error')
  }

  return NextResponse.redirect(redirectUrl)
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isProtectedPath && !user) {
    return redirectTo(request, '/login')
  }

  let role: string | null = null

  if (user && (isProtectedPath || isAuthPath)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active, deleted_at')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return redirectTo(request, '/login', 'session')
    }

    const profile = data as { role: string; is_active: boolean; deleted_at: string | null } | null
    role = profile?.role ?? null

    // Block disabled or soft-deleted accounts
    if (profile && (!profile.is_active || profile.deleted_at !== null)) {
      await supabase.auth.signOut()
      const response = redirectTo(request, '/login', 'account_disabled')
      supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
        response.cookies.set({ name, value, ...rest })
      })
      return response
    }
  }

  if (pathname.startsWith('/admin') && user && role !== 'admin') {
    return role === 'employee'
      ? redirectTo(request, '/employee')
      : redirectTo(request, '/login')
  }

  if (
    pathname.startsWith('/employee') &&
    user &&
    role !== 'employee' &&
    role !== 'admin'
  ) {
    return redirectTo(request, '/login')
  }

  if (isAuthPath && user) {
    const destination = role === 'admin' ? '/admin' : '/employee'
    return redirectTo(request, destination)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
