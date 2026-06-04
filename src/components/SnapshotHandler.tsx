'use client'

import { useEffect } from 'react'

/**
 * Componente que asegura que iOS capture el snapshot correcto del contenido
 * cuando la app pasa a segundo plano, evitando que muestre solo el logo/splash
 */
export default function SnapshotHandler() {
  useEffect(() => {
    // Detectar cuando la página está a punto de ir a segundo plano
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Cuando la página se oculta, asegurar que el contenido esté visible
        // Esto ayuda a iOS a capturar el snapshot correcto
        const body = document.body
        if (body) {
          // Forzar un repaint para asegurar que el contenido esté renderizado
          body.style.opacity = '1'
          body.style.visibility = 'visible'
          
          // Asegurar que no haya elementos de carga visibles
          const loadingElements = document.querySelectorAll('[data-loading="true"]')
          loadingElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.display = 'none'
            }
          })
        }
      } else {
        // Cuando vuelve a ser visible, restaurar cualquier estado necesario
        const body = document.body
        if (body) {
          body.style.opacity = ''
          body.style.visibility = ''
        }
      }
    }

    // Manejar el evento pagehide que iOS dispara antes de capturar el snapshot
    const handlePageHide = (event: PageTransitionEvent) => {
      // Asegurar que el contenido esté completamente renderizado
      // antes de que iOS capture el snapshot
      if (document.body) {
        // Forzar un layout reflow para asegurar que todo esté renderizado
        document.body.offsetHeight
        
        // Asegurar que el contenido principal esté visible
        const mainContent = document.querySelector('main') || document.body
        if (mainContent instanceof HTMLElement) {
          mainContent.style.display = ''
          mainContent.style.visibility = 'visible'
          mainContent.style.opacity = '1'
        }
      }
    }

    // Manejar cuando la página se muestra desde el cache
    const handlePageShow = (event: PageTransitionEvent) => {
      // Si viene del cache, el contenido debería estar ahí
      if (event.persisted) {
        // Forzar un repaint para asegurar que se muestre correctamente
        requestAnimationFrame(() => {
          if (document.body) {
            document.body.style.display = 'none'
            requestAnimationFrame(() => {
              if (document.body) {
                document.body.style.display = ''
              }
            })
          }
        })
      }
    }

    // Agregar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return null
}
