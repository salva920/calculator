'use client'

import { Box, HStack, Icon, Text, useColorModeValue } from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaBitcoin,
  FaCalculator,
  FaChartLine,
  FaLink,
  FaUsers,
} from 'react-icons/fa'

const NAV_ITEMS = [
  { href: '/', label: 'Resumen', icon: FaChartLine },
  { href: '/calculadora', label: 'Calc', icon: FaCalculator },
  { href: '/balance-diario', label: 'Balance', icon: FaBitcoin },
  { href: '/conexion-binance', label: 'Binance', icon: FaLink },
  { href: '/socios-capital', label: 'Socios', icon: FaUsers },
] as const

export default function MobileBottomNav() {
  const pathname = usePathname()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeColor = 'orange.500'
  const inactiveColor = useColorModeValue('gray.500', 'gray.400')
  const hoverBg = useColorModeValue('orange.50', 'whiteAlpha.100')

  return (
    <Box
      as="nav"
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={bg}
      borderTop="1px"
      borderColor={borderColor}
      pb="env(safe-area-inset-bottom, 0px)"
      boxShadow="0 -4px 20px rgba(0,0,0,0.08)"
    >
      <HStack justify="space-around" py={2} px={1}>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Box
              key={href}
              as={NextLink}
              href={href}
              flex={1}
              textAlign="center"
              py={1}
              px={0.5}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                as={icon}
                boxSize={5}
                color={isActive ? activeColor : inactiveColor}
                mx="auto"
                mb={0.5}
              />
              <Text
                fontSize="2xs"
                fontWeight={isActive ? 'bold' : 'medium'}
                color={isActive ? activeColor : inactiveColor}
                lineHeight="short"
                noOfLines={1}
              >
                {label}
              </Text>
            </Box>
          )
        })}
      </HStack>
    </Box>
  )
}
