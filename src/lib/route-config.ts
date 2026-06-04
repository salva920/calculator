/**
 * @deprecated Usar en cada route.ts:
 *   export const dynamic = 'force-dynamic'
 *   export const runtime = 'nodejs'
 * Next.js en Vercel no siempre respeta `export { dynamic } from '...'`.
 */
export const dynamic = 'force-dynamic'
