import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from './providers'
import AppShell from '@/components/AppShell'
import PwaRegister from '@/components/PwaRegister'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Binance P2P Calculator',
  description: 'Calculadora y dashboard P2P Binance USDT/VES',
  manifest: '/manifest.json',
  applicationName: 'P2P Calculator',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'P2P Calc',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f59e0b',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={jakarta.variable} style={{ fontFamily: 'var(--font-jakarta)' }}>
        <Providers>
          <PwaRegister />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
