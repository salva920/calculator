'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA: no se pudo registrar el service worker', err)
    })
  }, [])

  return null
}
