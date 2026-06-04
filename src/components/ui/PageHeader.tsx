'use client'

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  accent?: 'brand' | 'green' | 'blue' | 'purple' | 'teal'
}

const accentMap = {
  brand: { bar: 'brand.500', bg: 'brand.50', text: 'brand.800' },
  green: { bar: 'green.500', bg: 'green.50', text: 'green.800' },
  blue: { bar: 'blue.500', bg: 'blue.50', text: 'blue.800' },
  purple: { bar: 'purple.500', bg: 'purple.50', text: 'purple.800' },
  teal: { bar: 'teal.500', bg: 'teal.50', text: 'teal.800' },
}

export default function PageHeader({
  title,
  description,
  action,
  accent = 'brand',
}: PageHeaderProps) {
  const colors = accentMap[accent]

  return (
    <Box
      bg="surface.card"
      borderWidth="1px"
      borderColor="surface.border"
      borderRadius="2xl"
      boxShadow="card"
      p={{ base: 4, md: 5 }}
      mb={{ base: 4, md: 6 }}
    >
      <HStack align="flex-start" justify="space-between" spacing={4}>
        <HStack align="flex-start" spacing={3} flex={1} minW={0}>
          <Box w="4px" alignSelf="stretch" borderRadius="full" bg={colors.bar} flexShrink={0} />
          <VStack align="start" spacing={1} minW={0}>
            <Heading size={{ base: 'md', md: 'lg' }} color="gray.900" lineHeight="short">
              {title}
            </Heading>
            {description && (
              <Text fontSize="sm" color="gray.600" lineHeight="tall">
                {description}
              </Text>
            )}
          </VStack>
        </HStack>
        {action && <Box flexShrink={0}>{action}</Box>}
      </HStack>
    </Box>
  )
}
