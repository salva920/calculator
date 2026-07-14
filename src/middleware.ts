import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COOKIE_NAME,
  getProductionMisconfiguration,
  isAccessProtectionEnabled,
  verifySessionToken,
} from '@/lib/access-auth'

const PUBLIC_PATHS = new Set(['/login'])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname === '/manifest.json') return true
  if (pathname === '/sw.js') return true
  if (pathname === '/icon.svg') return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  const configError = getProductionMisconfiguration()
  if (configError) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: configError }, { status: 503 })
    }
    return new NextResponse(configError, { status: 503 })
  }

  if (!isAccessProtectionEnabled()) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const valid = await verifySessionToken(token)
    if (pathname === '/login' && valid) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const valid = await verifySessionToken(token)
  if (valid) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
