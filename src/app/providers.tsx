'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import theme from '@/lib/theme'
import { useBinanceAutoSync } from '@/hooks/useBinanceAutoSync'

function AutoSyncRunner() {
  useBinanceAutoSync()
  return null
}

function AutoSyncWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <>
      {pathname !== '/login' && <AutoSyncRunner />}
      {children}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AutoSyncWrapper>
          {children}
        </AutoSyncWrapper>
      </ChakraProvider>
    </QueryClientProvider>
  )
}


