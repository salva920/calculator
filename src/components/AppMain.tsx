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
      py={{ base: 4, md: 6 }}
      pb={{ base: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))', lg: 6 }}
      minH="100dvh"
      position="relative"
    >
      <Box
        position="absolute"
        top={0}
        left="50%"
        transform="translateX(-50%)"
        w="min(900px, 100%)"
        h="280px"
        bgGradient="radial(circle at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)"
        pointerEvents="none"
        zIndex={0}
      />
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  )
}
