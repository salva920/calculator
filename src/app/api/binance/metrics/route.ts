export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { computeDashboardMetrics } from '@/lib/metrics-compute'
import {
  getMetricsCacheEntry,
  METRICS_CACHE_TTL_MS,
  setMetricsCacheEntry,
} from '@/lib/metrics-cache'
import { isBuildTimeDynamicError } from '@/lib/api-route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const shouldProcessCycles = searchParams.get('processCycles') === 'true'
    const forceRefresh =
      searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true'

    if (!shouldProcessCycles && !forceRefresh) {
      const cacheKey = `metrics-${dateFilter}`
      const cached = getMetricsCacheEntry(cacheKey)
      if (cached && Date.now() - cached.timestamp < METRICS_CACHE_TTL_MS) {
        return NextResponse.json({
          success: true,
          metrics: cached.data,
          cached: true,
        })
      }
    }

    const metrics = await computeDashboardMetrics(dateFilter, shouldProcessCycles)

    const cacheKey = `metrics-${dateFilter}`
    setMetricsCacheEntry(cacheKey, metrics)

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error: unknown) {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const cacheKey = `metrics-${dateFilter}`
    const cached = getMetricsCacheEntry(cacheKey)

    if (cached) {
      return NextResponse.json({
        success: true,
        metrics: cached.data,
        cached: true,
        stale: true,
      })
    }

    if (!isBuildTimeDynamicError(error)) {
      console.error('Error calculando métricas:', error)
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Error al calcular métricas',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
