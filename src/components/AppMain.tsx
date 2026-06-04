'use client'

import { Box } from '@chakra-ui/react'

export default function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="main"
      maxW="container.xl"
      mx="auto"
      w="full"
      px={{ base: 3, sm: 4, md: 6 }}
      py={{ base: 4, md: 8 }}
      pb={{ base: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', lg: 8 }}
      minH="100dvh"
    >
      {children}
    </Box>
  )
}
