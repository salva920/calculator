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
        // Verificar si hay credenciales activas
        const credentialsResponse = await axios.get('/api/binance/credentials')
        if (credentialsResponse.data.success && credentialsResponse.data.connected) {
          const credentials = credentialsResponse.data.credentials
          
          // Solo sincronizar si está habilitado
          if (credentials.syncEnabled) {
            try {
              await axios.post('/api/binance/sync')
              // Disparar evento para actualizar componentes
              window.dispatchEvent(new CustomEvent('binance-sync-completed'))
            } catch (error) {
              console.error('Error en sincronización automática:', error)
            }
          }
        }
      } catch (error) {
        // Si no hay credenciales o hay error, no hacer nada
        console.debug('No hay credenciales de Binance configuradas o error al verificar')
      }
    }

    // Sincronizar inmediatamente al montar (si hay credenciales)
    checkAndSync()

    // Sincronizar automáticamente cada 2 minutos
    autoSyncInterval = setInterval(checkAndSync, 120000) // 2 minutos

    return () => {
      if (autoSyncInterval) {
        clearInterval(autoSyncInterval)
      }
    }
  }, [])
}
