import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  const isLoginPage = pathname === '/login'
  const isApiAuth = pathname.startsWith('/api/auth')

  const isPublic = pathname === '/public' || pathname.startsWith('/public/') || pathname.startsWith('/departments/') || pathname.startsWith('/supplier-portal')
  const isPublicApi = pathname === '/api/public-showcase' || pathname === '/api/settings' || pathname.startsWith('/api/settings/') || pathname.startsWith('/api/public-auth/') || pathname.startsWith('/api/public-bookings') || pathname.startsWith('/api/public-contact') || pathname.startsWith('/api/public-orders') || pathname.startsWith('/api/public-offers') || pathname.startsWith('/api/public-ads') || pathname.startsWith('/api/public-reviews') || pathname.startsWith('/api/public-banner') || pathname.startsWith('/api/public-coupons') || pathname.startsWith('/api/public-analytics') || pathname.startsWith('/api/public-page-meta') || pathname.startsWith('/api/public-departments') || pathname.startsWith('/api/placeholder') || pathname.startsWith('/api/public-social-links') || pathname.startsWith('/api/public-branches') || pathname.startsWith('/api/public-staff') || pathname.startsWith('/api/public-availability') || pathname.startsWith('/api/public-features') || pathname.startsWith('/api/public-my-bookings') || pathname.startsWith('/api/public-my-orders') || pathname.startsWith('/api/uploads/') || pathname.startsWith('/api/public-transfer-receipt') || pathname.startsWith('/api/public-attach-appointment-products') || pathname.startsWith('/api/supplier-auth/') || pathname.startsWith('/api/public-supplier-visits')

  if (isApiAuth || isPublic || isPublicApi) return NextResponse.next()
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Staff role: restrict to their portal + receipt print only
  if (isLoggedIn && (req.auth?.user as any)?.role === 'staff') {
    const isPortal = pathname.startsWith('/portal')
    const isPortalApi = pathname.startsWith('/api/portal')
    const isPrintReceipt = pathname.startsWith('/api/print-receipt')

    if (isPrintReceipt) return NextResponse.next()
    if (pathname.startsWith('/api/') && !isPortalApi) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!isPortal && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
