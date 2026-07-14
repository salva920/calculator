import { getProductionConfigError, isProduction } from '@/lib/env'

const COOKIE_NAME = 'p2p_access'
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 días

export { COOKIE_NAME, SESSION_MAX_AGE_MS }

export function getProductionMisconfiguration(): string | null {
  return getProductionConfigError()
}

export function getAccessPassword(): string | null {
  const p = process.env.APP_ACCESS_PASSWORD?.trim()
  return p && p.length >= 4 ? p : null
}

export function isAccessProtectionEnabled(): boolean {
  if (isProduction()) {
    return getAccessPassword() !== null
  }
  return getAccessPassword() !== null
}

function getSigningSecret(): string {
  const key =
    process.env.ENCRYPTION_KEY?.trim() ||
    process.env.APP_ACCESS_PASSWORD?.trim() ||
    ''
  if (key) return key
  if (isProduction()) {
    throw new Error('Configuración de sesión incompleta en producción')
  }
  return 'p2p-access-fallback-dev-only'
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionToken(): Promise<string> {
  const ts = String(Date.now())
  const sig = await hmacHex(ts, getSigningSecret())
  return `${ts}.${sig}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const ts = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false
  const age = Date.now() - tsNum
  if (age < 0 || age > SESSION_MAX_AGE_MS) return false
  const expected = await hmacHex(ts, getSigningSecret())
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  return diff === 0
}

export async function verifyAccessPassword(input: string): Promise<boolean> {
  const expected = getAccessPassword()
  if (!expected) return true
  const a = await hmacHex(input, getSigningSecret())
  const b = await hmacHex(expected, getSigningSecret())
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}
