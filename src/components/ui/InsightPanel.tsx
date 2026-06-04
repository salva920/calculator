'use client'

import { Box, type BoxProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

const accents = {
  brand: { bg: 'brand.50', border: 'brand.200', accent: 'brand.500' },
  green: { bg: 'green.50', border: 'green.200', accent: 'green.500' },
  red: { bg: 'red.50', border: 'red.200', accent: 'red.500' },
  orange: { bg: 'orange.50', border: 'orange.200', accent: 'orange.500' },
  purple: { bg: 'purple.50', border: 'purple.200', accent: 'purple.500' },
  neutral: { bg: 'surface.muted', border: 'surface.border', accent: 'gray.400' },
} as const

export type InsightAccent = keyof typeof accents

interface InsightPanelProps extends BoxProps {
  children: ReactNode
  accent?: InsightAccent
}

export default function InsightPanel({
  children,
  accent = 'neutral',
  ...rest
}: InsightPanelProps) {
  const palette = accents[accent]
  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg={palette.bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={palette.border}
      borderLeftWidth="3px"
      borderLeftColor={palette.accent}
      {...rest}
    >
      {children}
    </Box>
  )
}
