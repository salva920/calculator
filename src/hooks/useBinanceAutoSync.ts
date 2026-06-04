'use client'

import { useEffect } from 'react'
import axios from 'axios'
import {
  getBinanceSyncIntervalMs,
  requestBinanceSync,
} from '@/lib/binance-sync-client'

/**
 * Única sincronización automática con Binance en toda la app (cada 2 min).
 * El dashboard y conexión ya no llaman /api/binance/sync por su cuenta.
 */
export function useBinanceAutoSync() {
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        const credentialsResponse = await axios.get('/api/binance/credentials')
        if (!credentialsResponse.data.success || !credentialsResponse.data.connected) return
        if (!credentialsResponse.data.credentials?.syncEnabled) return

        await requestBinanceSync()
      } catch {
        // Sin credenciales o error de red
      }
    }

    void checkAndSync()
    const autoSyncInterval = setInterval(checkAndSync, getBinanceSyncIntervalMs())

    return () => clearInterval(autoSyncInterval)
  }, [])
}
