import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  COOKIE_NAME,
  cookieOptions,
  createSessionToken,
  getAccessPassword,
  getProductionMisconfiguration,
  isAccessProtectionEnabled,
  verifyAccessPassword,
} from '@/lib/access-auth'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const configError = getProductionMisconfiguration()
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 })
  }

  if (!isAccessProtectionEnabled()) {
    return NextResponse.json({ ok: true, protection: false })
  }

  const ip = getClientIp(request)
  if (isRateLimited(`login:${ip}`)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      { status: 429 }
    )
  }

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) {
    return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 })
  }

  const valid = await verifyAccessPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const token = await createSessionToken()
  const store = cookies()
  store.set(COOKIE_NAME, token, cookieOptions(30 * 24 * 60 * 60))

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({
    protectionEnabled: isAccessProtectionEnabled(),
    configured: !!getAccessPassword(),
  })
}
