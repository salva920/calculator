import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, cookieOptions } from '@/lib/access-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const store = cookies()
  store.set(COOKIE_NAME, '', { ...cookieOptions(0), maxAge: 0 })
  return NextResponse.json({ ok: true })
}
