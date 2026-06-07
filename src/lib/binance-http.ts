import type { AxiosRequestConfig } from 'axios'

/** Config HTTP compartida para llamadas a Binance (timeout + proxy opcional). */
export function getBinanceAxiosConfig(timeoutMs: number): AxiosRequestConfig {
  const config: AxiosRequestConfig = { timeout: timeoutMs }
  const proxyUrl = process.env.BINANCE_HTTP_PROXY?.trim()
  if (!proxyUrl) return config

  try {
    const u = new URL(proxyUrl)
    const port = u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80
    config.proxy = {
      protocol: u.protocol.replace(':', ''),
      host: u.hostname,
      port,
      auth:
        u.username || u.password
          ? {
              username: decodeURIComponent(u.username),
              password: decodeURIComponent(u.password),
            }
          : undefined,
    }
  } catch {
    console.warn('[binance-http] BINANCE_HTTP_PROXY inválida; se ignora el proxy.')
  }

  return config
}
