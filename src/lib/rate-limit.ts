const attempts = new Map<string, { count: number; resetAt: number }>()

const DEFAULT_MAX = 5
const DEFAULT_WINDOW_MS = 15 * 60 * 1000

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function isRateLimited(
  key: string,
  maxAttempts = DEFAULT_MAX,
  windowMs = DEFAULT_WINDOW_MS
): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count += 1
  return entry.count > maxAttempts
}
