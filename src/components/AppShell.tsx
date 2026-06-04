'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import AppMain from '@/components/AppMain'
import MobileBottomNav from '@/components/MobileBottomNav'
import InstallPwaBanner from '@/components/InstallPwaBanner'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <>
      <Navigation />
      <AppMain>{children}</AppMain>
      <InstallPwaBanner />
      <MobileBottomNav />
    </>
  )
}
