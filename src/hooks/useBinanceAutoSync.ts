'use client'

import { useEffect } from 'react'
import axios from 'axios'

/**
 * Hook global para sincronización automática de Binance
 * Se ejecuta independientemente de qué componente esté montado
 */
export function useBinanceAutoSync() {
  useEffect(() => {
    let autoSyncInterval: NodeJS.Timeout | null = null

    const checkAndSync = async () => {
      try {
        const credentialsResponse = await axios.get('/api/binance/credentials')
        if (credentialsResponse.data.success && credentialsResponse.data.connected) {
          const credentials = credentialsResponse.data.credentials

          if (credentials.syncEnabled) {
            try {
              await axios.post('/api/binance/sync', {}, { timeout: 120000 })
              window.dispatchEvent(new CustomEvent('binance-sync-completed'))
            } catch (error) {
              if (axios.isAxiosError(error)) {
                const status = error.response?.status
                const msg = error.response?.data?.error as string | undefined
                // Respuestas esperadas: sin credenciales, sync deshabilitado
                if (status === 400) return
                if (status === 500 && msg?.includes('ENCRYPTION_KEY')) {
                  console.warn('Sync automático:', msg)
                  return
                }
              }
              console.error('Error en sincronización automática:', error)
            }
          }
        }
      } catch {
        // Sin credenciales configuradas
      }
    }

    checkAndSync()
    autoSyncInterval = setInterval(checkAndSync, 120000)

    return () => {
      if (autoSyncInterval) {
        clearInterval(autoSyncInterval)
      }
    }
  }, [])
}
