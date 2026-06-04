'use client'

import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaCalculator,
  FaChartLine,
  FaLink,
  FaUsers,
  FaWallet,
} from 'react-icons/fa'

const NAV_ITEMS = [
  { href: '/', label: 'Resumen', icon: FaChartLine },
  { href: '/calculadora', label: 'Calc', icon: FaCalculator },
  { href: '/balance-diario', label: 'Balance', icon: FaWallet },
  { href: '/conexion-binance', label: 'Binance', icon: FaLink },
  { href: '/socios-capital', label: 'Socios', icon: FaUsers },
] as const

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <Box
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      px={3}
      pb="calc(10px + env(safe-area-inset-bottom, 0px))"
      pointerEvents="none"
    >
      <Flex
        as="nav"
        pointerEvents="auto"
        bg="rgba(255,255,255,0.95)"
        backdropFilter="blur(16px)"
        borderWidth="1px"
        borderColor="surface.border"
        borderRadius="2xl"
        boxShadow="float"
        justify="space-around"
        py={2}
        px={1}
      >
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Box
              key={href}
              as={NextLink}
              href={href}
              flex={1}
              textAlign="center"
              py={1.5}
              px={0.5}
              borderRadius="xl"
              bg={isActive ? 'brand.50' : 'transparent'}
              transition="background 0.2s"
              _hover={{ bg: isActive ? 'brand.50' : 'surface.muted' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                as={icon}
                boxSize={5}
                color={isActive ? 'brand.600' : 'gray.400'}
                mx="auto"
                mb={0.5}
              />
              <Text
                fontSize="2xs"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? 'brand.700' : 'gray.500'}
                lineHeight="short"
                noOfLines={1}
              >
                {label}
              </Text>
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}
