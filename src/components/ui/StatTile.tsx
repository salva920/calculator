'use client'

import { Stat, type StatProps } from '@chakra-ui/react'
import type { InsightAccent } from './InsightPanel'

const tileBg: Record<InsightAccent, string> = {
  brand: 'brand.50',
  green: 'green.50',
  red: 'red.50',
  orange: 'orange.50',
  purple: 'purple.50',
  blue: 'blue.50',
  neutral: 'surface.muted',
}

interface StatTileProps extends StatProps {
  accent?: InsightAccent
}

export default function StatTile({ accent = 'neutral', children, ...rest }: StatTileProps) {
  return (
    <Stat
      textAlign="center"
      p={{ base: 3, md: 4 }}
      bg={tileBg[accent]}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="surface.border"
      {...rest}
    >
      {children}
    </Stat>
  )
}
