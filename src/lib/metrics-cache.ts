const metricsCache = new Map<string, { data: unknown; timestamp: number }>()

export const METRICS_CACHE_TTL_MS = 10_000

export function getMetricsCacheEntry(key: string) {
  return metricsCache.get(key)
}

export function setMetricsCacheEntry(key: string, data: unknown) {
  metricsCache.set(key, { data, timestamp: Date.now() })
}

export function invalidateMetricsCache() {
  metricsCache.clear()
}
