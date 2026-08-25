import crypto from 'crypto'
import axios from 'axios'
import { getBinanceAxiosConfig } from '@/lib/binance-http'
import {
  BinanceGeoRestrictedError,
  isBinanceGeoRestrictedMessage,
  throwIfBinanceGeoRestricted,
} from '@/lib/binance-errors'

const BINANCE_HTTP_TIMEOUT_MS = 20000

/** Páginas del historial C2C (100 filas/página). Subir vía BINANCE_P2P_HISTORY_MAX_PAGES si tienes mucho volumen. */
const DEFAULT_P2P_HISTORY_MAX_PAGES = 2000
const ABSOLUTE_P2P_HISTORY_MAX_PAGES = 5000

function resolveP2PHistoryMaxPages(): number {
  const raw = process.env.BINANCE_P2P_HISTORY_MAX_PAGES
  const n = raw ? parseInt(raw, 10) : NaN
  if (Number.isFinite(n) && n > 0) {
    return Math.min(n, ABSOLUTE_P2P_HISTORY_MAX_PAGES)
  }
  return DEFAULT_P2P_HISTORY_MAX_PAGES
}

export interface BinanceP2POrder {
  orderNumber: string
  advNo: string
  tradeType: 'BUY' | 'SELL'
  asset: string
  fiat: string
  fiatAmount: string
  amount: string
  totalPrice: string
  unitPrice: string
  orderStatus: string
  createTime: number
  /** ms desde epoch si Binance lo envía (updateTime, etc.); sirve para completedAt en BD */
  completionTimeMs?: number | null
  commission: string
  counterPartName: string
  paymentMethod: string
}

export interface BinanceP2PResponse {
  code: string
  message: string
  messageDetail: string
  data: BinanceP2POrder[]
  total: number
  success: boolean
}

/** Campos opcionales que a veces envía Binance en C2C (no siempre documentados). */
function extractBinanceCompletionMs(order: any): number | null {
  const keys = [
    'updateTime',
    'modifyTime',
    'payTime',
    'finishTime',
    'completeTime',
    'advertisementFinishTime',
    'confirmPayTime',
    'releaseTime',
  ]
  for (const k of keys) {
    const v = order?.[k]
    const n = typeof v === 'string' ? parseInt(v, 10) : Number(v)
    if (Number.isFinite(n) && n > 1e12) return n
  }
  return null
}

function mapUserOrderHistoryRow(order: any, tradeType: 'BUY' | 'SELL'): BinanceP2POrder {
  const createTime = Number(order.createTime) || Date.now()
  return {
    orderNumber: order.orderNumber || order.orderNo || '',
    advNo: order.advNo || '',
    tradeType: order.tradeType || tradeType,
    asset: order.asset || 'USDT',
    fiat: order.fiat || 'VES',
    fiatAmount: String(order.fiatAmount || order.totalPrice || 0),
    amount: String(order.amount || 0),
    totalPrice: String(order.totalPrice || order.fiatAmount || 0),
    unitPrice: String(order.unitPrice || 0),
    orderStatus: order.orderStatus || 'COMPLETED',
    createTime,
    completionTimeMs: extractBinanceCompletionMs(order),
    commission: String(order.commission || 0),
    counterPartName:
      order.counterPartName ||
      order.counterpartNickname ||
      order.counterPartyNickName ||
      order.buyerNickname ||
      order.sellerNickname ||
      order.nickName ||
      '',
    paymentMethod: extractPaymentMethod(order),
  }
}

function extractPaymentMethod(order: any): string {
  if (typeof order?.paymentMethod === 'string' && order.paymentMethod.trim()) {
    return order.paymentMethod.trim()
  }
  if (typeof order?.payMethodName === 'string' && order.payMethodName.trim()) {
    return order.payMethodName.trim()
  }
  if (typeof order?.paymentMethodName === 'string' && order.paymentMethodName.trim()) {
    return order.paymentMethodName.trim()
  }
  return ''
}

export class BinanceAPI {
  private apiKey: string
  private apiSecret: string
  private baseURL: string = 'https://p2p.binance.com'

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex')
  }

  /**
   * Obtiene el tiempo del servidor de Binance para sincronización
   */
  private async getServerTime(): Promise<number> {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/time', getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS))
      return response.data.serverTime
    } catch (error) {
      // Si falla, usar tiempo local
      return Date.now()
    }
  }

  private async request(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Para P2P, Binance usa un endpoint diferente
      // Nota: La API pública de P2P no requiere autenticación para consultar órdenes
      // Pero para obtener las órdenes del usuario, necesitamos usar la API de cuenta
      
      const timestamp = Date.now()
      const queryString = new URLSearchParams({
        ...params,
        timestamp: timestamp.toString(),
      }).toString()

      const signature = this.generateSignature(queryString)
      
      const url = `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`
      
      const response = await axios.get(url, {
        ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Binance API Error:', error.response?.data || error.message)
      throw new Error(`Error de Binance API: ${error.response?.data?.msg || error.message}`)
    }
  }

  /**
   * Obtiene las órdenes P2P del usuario
   * Nota: Binance P2P no tiene una API oficial pública para esto
   * Usaremos un enfoque alternativo consultando las órdenes desde la web
   */
  async getP2POrders(
    tradeType: 'BUY' | 'SELL' = 'BUY',
    startTime?: number,
    endTime?: number
  ): Promise<BinanceP2POrder[]> {
    try {
      // Binance P2P usa un endpoint diferente
      // Intentamos obtener las órdenes usando el endpoint de búsqueda
      const params: Record<string, any> = {
        asset: 'USDT',
        fiat: 'VES',
        tradeType: tradeType,
        page: 1,
        rows: 20,
      }

      if (startTime) {
        params.startTime = startTime
      }
      if (endTime) {
        params.endTime = endTime
      }

      // Nota: Este endpoint es para buscar anuncios, no órdenes del usuario
      // Para obtener órdenes reales del usuario, necesitaríamos usar scraping o una API no oficial
      // Por ahora, implementamos una estructura que puede ser extendida
      
      const response = await axios.get('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/portal/search', {
        ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
        params,
      })

      // Esta respuesta contiene anuncios, no órdenes del usuario
      // Necesitamos una implementación diferente para obtener órdenes reales
      
      return []
    } catch (error: any) {
      console.error('Error obteniendo órdenes P2P:', error)
      // Retornamos array vacío si hay error
      return []
    }
  }

  /**
   * Una página del historial C2C (máx. 100 filas). Parámetros según documentación Binance: startTimestamp / endTimestamp.
   */
  private async fetchUserOrderHistoryPage(
    tradeType: 'BUY' | 'SELL',
    startMs: number | undefined,
    endMs: number | undefined,
    page: number,
    requestTimestamp: number
  ): Promise<BinanceP2POrder[]> {
    const recvWindow = 10000
    const params: Record<string, any> = {
      recvWindow: recvWindow.toString(),
      timestamp: requestTimestamp.toString(),
      tradeType,
      page,
      rows: 100,
    }
    if (startMs != null && Number.isFinite(startMs)) {
      params.startTimestamp = String(startMs)
    }
    if (endMs != null && Number.isFinite(endMs)) {
      params.endTimestamp = String(endMs)
    }

    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key]
          return acc
        },
        {} as Record<string, string>
      )

    const queryString = new URLSearchParams(
      Object.entries(sortedParams).map(([k, v]) => [k, String(v)])
    ).toString()
    const signature = this.generateSignature(queryString)
    const url = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${queryString}&signature=${signature}`

    const response = await axios.get(url, {
      ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    })

    const payload = response.data
    throwIfBinanceGeoRestricted(payload)
    const rows = Array.isArray(payload?.data) ? payload.data : []
    if (rows.length > 0) {
      return rows.map((order: any) => mapUserOrderHistoryRow(order, tradeType))
    }
    return []
  }

  /**
   * Obtiene el historial de órdenes P2P del usuario
   * Nota: Esto requiere usar la API de cuenta de Binance que necesita permisos especiales
   * Requiere permisos: Enable Reading en la API Key
   */
  async getUserP2PHistory(
    tradeType: 'BUY' | 'SELL' = 'BUY',
    startTime?: number,
    endTime?: number
  ): Promise<BinanceP2POrder[]> {
    const MAX_PAGES = resolveP2PHistoryMaxPages()

    const PAGE_ROWS = 100
    const fetchAllPages = async (): Promise<BinanceP2POrder[]> => {
      const acc: BinanceP2POrder[] = []
      for (let page = 1; page <= MAX_PAGES; page++) {
        const requestTimestamp = await this.getServerTime()
        const batch = await this.fetchUserOrderHistoryPage(
          tradeType,
          startTime,
          endTime,
          page,
          requestTimestamp
        )
        if (!batch.length) break
        acc.push(...batch)
        // Binance puede devolver 50 filas en página 1 y más en página 2 aunque pidamos 100.
        // Solo parar cuando la página viene vacía (no cuando batch.length < PAGE_ROWS).
        if (page === MAX_PAGES && batch.length >= PAGE_ROWS) {
          console.warn(
            `[BinanceAPI] Historial P2P ${tradeType}: límite de páginas (${MAX_PAGES} × ${PAGE_ROWS}). Puede haber más órdenes; define BINANCE_P2P_HISTORY_MAX_PAGES (máx. ${ABSOLUTE_P2P_HISTORY_MAX_PAGES}).`
          )
        }
      }
      return acc
    }

    try {
      return await fetchAllPages()
    } catch (error: any) {
      if (error instanceof BinanceGeoRestrictedError) {
        throw error
      }

      const errorData = error.response?.data
      const errorMsg = errorData?.msg || errorData?.message || error.message
      if (isBinanceGeoRestrictedMessage(errorMsg)) {
        throw new BinanceGeoRestrictedError(errorMsg)
      }

      if (errorData?.code === -1021) {
        console.warn('Error de sincronización de tiempo (-1021), reintentando con tiempo del servidor de Binance...')
        try {
          return await fetchAllPages()
        } catch (retryError: any) {
          console.error('Error en reintento con timestamp ajustado:', retryError.response?.data || retryError.message)
        }
      }

      if (error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')) {
        console.warn('Timeout obteniendo historial P2P de Binance; se continuará con datos vacíos.')
        return []
      }

      console.error('Error obteniendo historial P2P:', errorData || error.message)

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          'Permisos insuficientes. Asegúrate de que tu API Key tenga permisos de lectura (Enable Reading) y acceso a C2C.'
        )
      }

      return []
    }
  }

  /**
   * Obtiene el saldo USDT de la cuenta (Spot).
   * Usa el mismo endpoint que verifyCredentials: GET /api/v3/account
   * Requiere API Key con permiso "Enable Reading".
   */
  async getUSDTBalance(): Promise<{ free: number; locked: number; total: number } | null> {
    const summary = await this.getSpotWalletSummary()
    return summary?.usdt ?? null
  }

  /**
   * Resumen de billetera Spot: USDT + activos con saldo + estimado total en USDT.
   */
  async getSpotWalletSummary(): Promise<{
    usdt: { free: number; locked: number; total: number }
    assets: Array<{ asset: string; free: number; locked: number; total: number; usdtValue: number }>
    estimatedTotalUsdt: number
  } | null> {
    try {
      const serverTime = await this.getServerTime()
      const recvWindow = 10000
      const queryString = new URLSearchParams({
        recvWindow: recvWindow.toString(),
        timestamp: serverTime.toString(),
      }).toString()
      const signature = this.generateSignature(queryString)
      const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`

      const response = await axios.get(url, {
        ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
        headers: { 'X-MBX-APIKEY': this.apiKey },
      })

      throwIfBinanceGeoRestricted(response.data)
      const balances = (response.data?.balances || []) as Array<{
        asset: string
        free: string
        locked: string
      }>

      const nonZero = balances
        .map((b) => {
          const free = parseFloat(b.free || '0')
          const locked = parseFloat(b.locked || '0')
          return {
            asset: (b.asset || '').toUpperCase(),
            free,
            locked,
            total: free + locked,
          }
        })
        .filter((b) => b.total > 0)

      const usdtRow = nonZero.find((b) => b.asset === 'USDT')
      const usdt = usdtRow
        ? { free: usdtRow.free, locked: usdtRow.locked, total: usdtRow.total }
        : { free: 0, locked: 0, total: 0 }

      // Precios para estimar valor en USDT (máx. 15 activos para no saturar)
      const toPrice = nonZero.filter((b) => b.asset !== 'USDT').slice(0, 15)
      const priceMap = new Map<string, number>()

      await Promise.all(
        toPrice.map(async (b) => {
          try {
            const symbol = `${b.asset}USDT`
            const priceRes = await axios.get('https://api.binance.com/api/v3/ticker/price', {
              ...getBinanceAxiosConfig(8000),
              params: { symbol },
            })
            const price = parseFloat(priceRes.data?.price || '0')
            if (Number.isFinite(price) && price > 0) {
              priceMap.set(b.asset, price)
            }
          } catch {
            // Algunos activos no tienen par *USDT; se omiten del estimado
          }
        })
      )

      const assets = nonZero.map((b) => {
        if (b.asset === 'USDT') {
          return { ...b, usdtValue: b.total }
        }
        const price = priceMap.get(b.asset) ?? 0
        return { ...b, usdtValue: price > 0 ? b.total * price : 0 }
      })

      const estimatedTotalUsdt = assets.reduce((sum, a) => sum + a.usdtValue, 0)

      return {
        usdt,
        assets: assets.sort((a, b) => b.usdtValue - a.usdtValue),
        estimatedTotalUsdt,
      }
    } catch (error: any) {
      if (error instanceof BinanceGeoRestrictedError) {
        throw error
      }
      console.error('Error obteniendo saldo Spot:', error.response?.data || error.message)
      return null
    }
  }

  /**
   * Saldo Funding (donde suele estar el USDT de P2P).
   * POST /sapi/v1/asset/get-funding-asset
   */
  async getFundingUsdtBalance(): Promise<{
    free: number
    locked: number
    freeze: number
    total: number
  } | null> {
    try {
      const serverTime = await this.getServerTime()
      const recvWindow = 10000
      const params = new URLSearchParams({
        asset: 'USDT',
        recvWindow: recvWindow.toString(),
        timestamp: serverTime.toString(),
      })
      const queryString = params.toString()
      const signature = this.generateSignature(queryString)

      const response = await axios.post(
        `https://api.binance.com/sapi/v1/asset/get-funding-asset?${queryString}&signature=${signature}`,
        null,
        {
          ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
          headers: { 'X-MBX-APIKEY': this.apiKey },
        }
      )

      throwIfBinanceGeoRestricted(response.data)

      const rows = Array.isArray(response.data) ? response.data : []
      const usdt = rows.find((b: any) => (b.asset || '').toUpperCase() === 'USDT')
      if (!usdt) {
        return { free: 0, locked: 0, freeze: 0, total: 0 }
      }

      const free = parseFloat(usdt.free || '0')
      const locked = parseFloat(usdt.locked || '0')
      const freeze = parseFloat(usdt.freeze || '0')
      return { free, locked, freeze, total: free + locked + freeze }
    } catch (error: any) {
      if (error instanceof BinanceGeoRestrictedError) {
        throw error
      }
      console.error('Error obteniendo saldo Funding:', error.response?.data || error.message)
      return null
    }
  }

  /**
   * Spot + Funding: total operativo para P2P.
   */
  async getCombinedWalletSummary(): Promise<{
    spot: {
      usdt: { free: number; locked: number; total: number }
      estimatedTotalUsdt: number
      assets: Array<{ asset: string; free: number; locked: number; total: number; usdtValue: number }>
    }
    funding: { free: number; locked: number; freeze: number; total: number }
    usdtTotal: number
  } | null> {
    const [spot, funding] = await Promise.all([
      this.getSpotWalletSummary(),
      this.getFundingUsdtBalance(),
    ])

    if (!spot && !funding) return null

    const spotUsdt = spot?.usdt ?? { free: 0, locked: 0, total: 0 }
    const fundingUsdt = funding ?? { free: 0, locked: 0, freeze: 0, total: 0 }

    return {
      spot: {
        usdt: spotUsdt,
        estimatedTotalUsdt: spot?.estimatedTotalUsdt ?? 0,
        assets: spot?.assets ?? [],
      },
      funding: fundingUsdt,
      usdtTotal: spotUsdt.total + fundingUsdt.total,
    }
  }

  /**
   * Verifica que las credenciales sean válidas
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      // Usar el tiempo actual del servidor en milisegundos
      const timestamp = Date.now()
      
      // Agregar recvWindow para permitir diferencias de tiempo (5000ms = 5 segundos)
      const recvWindow = 5000
      
      // Crear query string con parámetros en orden alfabético
      // Binance requiere que los parámetros estén ordenados alfabéticamente
      const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`
      
      // Generar firma usando solo los parámetros de la query (sin signature)
      const signature = this.generateSignature(queryString)

      // Construir URL completa con query string y signature
      const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`

      // Hacer la petición
      const response = await axios.get(url, {
        ...getBinanceAxiosConfig(BINANCE_HTTP_TIMEOUT_MS),
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
      })

      throwIfBinanceGeoRestricted(response.data)
      return response.status === 200
    } catch (error: any) {
      const code = error.response?.data?.code
      if (process.env.NODE_ENV === 'development') {
        console.error('[Binance] verifyCredentials failed:', code ?? error.message)
      }
      return false
    }
  }
}

