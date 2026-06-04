/** Debe declararse inline en cada route.ts (Next no siempre detecta re-exports en Vercel). */
export const dynamic = 'force-dynamic' as const
export const runtime = 'nodejs' as const

export function isBuildTimeDynamicError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const digest = (error as Error & { digest?: string }).digest
  return (
    digest === 'DYNAMIC_SERVER_USAGE' ||
    error.message.includes('Dynamic server usage') ||
    error.message.includes("couldn't be rendered statically")
  )
}
