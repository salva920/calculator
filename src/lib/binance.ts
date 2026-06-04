import crypto from 'crypto'
import axios, { AxiosInstance } from 'axios'

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
    counterPartName: order.counterPartName || order.counterpartNickname || '',
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
      const response = await axios.get('https://api.binance.com/api/v3/time')
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
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: BINANCE_HTTP_TIMEOUT_MS,
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
        params,
        timeout: BINANCE_HTTP_TIMEOUT_MS,
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
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
      timeout: BINANCE_HTTP_TIMEOUT_MS,
    })

    const payload = response.data
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
      const errorData = error.response?.data

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
        headers: { 'X-MBX-APIKEY': this.apiKey },
        timeout: BINANCE_HTTP_TIMEOUT_MS,
      })

      const balances = response.data?.balances || []
      const usdt = balances.find((b: any) => (b.asset || '').toUpperCase() === 'USDT')
      if (!usdt) {
        return { free: 0, locked: 0, total: 0 }
      }
      const free = parseFloat(usdt.free || '0')
      const locked = parseFloat(usdt.locked || '0')
      return { free, locked, total: free + locked }
    } catch (error: any) {
      console.error('Error obteniendo saldo USDT:', error.response?.data || error.message)
      return null
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

      // Debug: Mostrar información útil (sin exponer el secret completo)
      console.log('Verificando credenciales Binance:')
      console.log('- API Key:', this.apiKey.substring(0, 10) + '...' + this.apiKey.substring(this.apiKey.length - 5))
      console.log('- Secret length:', this.apiSecret.length)
      console.log('- Timestamp:', timestamp)
      console.log('- Signature:', signature.substring(0, 20) + '...')

      // Hacer la petición
      const response = await axios.get(url, {
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
        timeout: BINANCE_HTTP_TIMEOUT_MS,
      })

      console.log('✓ Credenciales verificadas correctamente')
      return response.status === 200
    } catch (error: any) {
      // Si el error es de firma, puede ser un problema de sincronización de tiempo o credenciales incorrectas
      if (error.response?.data?.code === -1022) {
        console.error('❌ Error de firma (-1022). Posibles causas:')
        console.error('1. API Key o Secret incorrectos o con espacios adicionales')
        console.error('2. El tiempo del servidor no está sincronizado')
        console.error('3. La API Key no tiene permisos de lectura')
        console.error('4. La API Key está restringida por IP y tu IP no está permitida')
        console.error('5. La API Key fue revocada o expiró')
        console.error('')
        console.error('💡 Solución recomendada:')
        console.error('   - Ve a Binance → API Management')
        console.error('   - Verifica que tu API Key esté activa y tenga "Enable Reading"')
        console.error('   - Verifica que no haya restricciones de IP')
        console.error('   - Si las credenciales fueron compartidas públicamente, crea una nueva API Key')
      } else if (error.response?.data?.code === -2015) {
        console.error('❌ Error -2015: IP no permitida')
        console.error('   Tu IP no está en la lista de IPs permitidas de la API Key')
      } else if (error.response?.data?.code === -2010) {
        console.error('❌ Error -2010: Permisos insuficientes')
        console.error('   La API Key no tiene permisos de lectura')
      }
      console.error('Error completo:', error.response?.data || error.message)
      return false
    }
  }
}

