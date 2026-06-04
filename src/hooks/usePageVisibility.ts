'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para detectar cuando la página se vuelve visible o invisible
 * Útil para manejar el estado cuando la app pasa a segundo plano en iOS
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [wasHidden, setWasHidden] = useState(false)

  useEffect(() => {
    // Función para manejar cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false)
        setWasHidden(true)
      } else {
        setIsVisible(true)
        // Cuando vuelve a ser visible, disparar evento personalizado
        if (wasHidden) {
          window.dispatchEvent(new CustomEvent('page-visible'))
        }
      }
    }

    // Función para manejar cuando la página se carga después de estar en segundo plano
    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la página se muestra desde el cache (back/forward cache)
      if (event.persisted) {
        window.dispatchEvent(new CustomEvent('page-restored'))
      }
    }

    // Función para prevenir que la página se descargue cuando pasa a segundo plano
    const handlePageHide = (event: PageTransitionEvent) => {
      // Intentar mantener la página en memoria
      if (event.persisted === false) {
        // La página no se mantendrá en cache, pero podemos intentar prevenir la recarga
        event.preventDefault()
      }
    }

    // Agregar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('pagehide', handlePageHide)

    // Verificar estado inicial
    setIsVisible(!document.hidden)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [wasHidden])

  return { isVisible, wasHidden }
}
