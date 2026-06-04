'use client'

import { Box, Flex, Heading, Link, Spacer, Button, useColorModeValue, HStack, VStack, Badge, Text, ButtonGroup } from '@chakra-ui/react'
import NextLink from 'next/link'
import { motion } from 'framer-motion'
import { FaBitcoin, FaChartLine } from 'react-icons/fa'

const MotionBox = motion(Box)

export default function Navigation() {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        as="nav"
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        px={8}
        py={4}
        position="sticky"
        top={0}
        zIndex={1000}
        backdropFilter="blur(10px)"
      >
        <Flex align="center" maxW="container.xl" mx="auto">
          <NextLink href="/">
            <HStack spacing={3} align="center">
              <FaBitcoin color="#F7931A" size={24} />
              <Heading as="h1" size="lg" bgGradient="linear(to-r, orange.400, yellow.400)" bgClip="text">
                Binance P2P Calculator
              </Heading>
            </HStack>
          </NextLink>
          
          <Spacer />
          
          <VStack align="flex-end" spacing={2}>
            <HStack spacing={3} align="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1} rounded="full">
                USDT/VES
              </Badge>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1} rounded="full">
                <HStack spacing={1}>
                  <FaChartLine size={12} />
                  <Text>Tiempo Real</Text>
                </HStack>
              </Badge>
              <Button as={Link} href="https://p2p.binance.com" isExternal variant="outline" size="sm">
                Ir a Binance P2P
              </Button>
            </HStack>
            <ButtonGroup size="sm" variant="ghost" spacing={2}>
              <Button as={NextLink} href="/">
                Resumen
              </Button>
              <Button as={NextLink} href="/calculadora">
                Calculadora
              </Button>
              <Button as={NextLink} href="/balance-diario">
                Balance Diario
              </Button>
              <Button as={NextLink} href="/conexion-binance">
                Conexión Binance
              </Button>
              <Button as={NextLink} href="/socios-capital">
                Socios capital
              </Button>
            </ButtonGroup>
          </VStack>
        </Flex>
      </Box>
    </MotionBox>
  )
}
