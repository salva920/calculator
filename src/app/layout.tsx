import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'
import AppMain from '@/components/AppMain'
import MobileBottomNav from '@/components/MobileBottomNav'
import InstallPwaBanner from '@/components/InstallPwaBanner'
import PwaRegister from '@/components/PwaRegister'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
  themeColor: '#f6ad55',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <PwaRegister />
          <Navigation />
          <AppMain>{children}</AppMain>
          <InstallPwaBanner />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  )
}
