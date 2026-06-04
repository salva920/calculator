'use client'

import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Spacer,
  Text,
  useDisclosure,
  VStack,
  Hide,
  Show,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaBitcoin,
  FaBars,
  FaCalculator,
  FaChartLine,
  FaExternalLinkAlt,
  FaLink,
  FaUsers,
  FaWallet,
  FaSignOutAlt,
} from 'react-icons/fa'

const NAV_LINKS = [
  { href: '/', label: 'Resumen', icon: FaChartLine },
  { href: '/calculadora', label: 'Calculadora', icon: FaCalculator },
  { href: '/balance-diario', label: 'Balance', icon: FaWallet },
  { href: '/conexion-binance', label: 'Binance', icon: FaLink },
  { href: '/socios-capital', label: 'Socios', icon: FaUsers },
] as const

export default function Navigation() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={1000}
        px={{ base: 3, md: 4 }}
        pt={{ base: 2, md: 3 }}
        pb={0}
      >
        <Flex
          align="center"
          maxW="container.xl"
          mx="auto"
          bg="rgba(255,255,255,0.92)"
          backdropFilter="blur(12px)"
          borderWidth="1px"
          borderColor="surface.border"
          borderRadius="2xl"
          boxShadow="nav"
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          gap={3}
        >
          <HStack as={NextLink} href="/" spacing={2.5} flexShrink={0}>
            <Flex
              align="center"
              justify="center"
              w={9}
              h={9}
              borderRadius="xl"
              bg="linear-gradient(135deg, #F0B90B 0%, #F59E0B 100%)"
              boxShadow="0 4px 12px rgba(245, 158, 11, 0.35)"
            >
              <FaBitcoin color="white" size={18} />
            </Flex>
            <Box>
              <Text fontWeight="700" fontSize={{ base: 'sm', md: 'md' }} color="gray.900" lineHeight="1.2">
                <Show above="sm">P2P Calculator</Show>
                <Hide above="sm">P2P Calc</Hide>
              </Text>
              <Text fontSize="2xs" color="gray.500" display={{ base: 'none', sm: 'block' }}>
                USDT / VES · Tiempo real
              </Text>
            </Box>
          </HStack>

          <Spacer />

          <Show above="lg">
            <HStack
              spacing={1}
              bg="surface.muted"
              p={1}
              borderRadius="full"
              borderWidth="1px"
              borderColor="surface.border"
            >
              {NAV_LINKS.map(({ href, label, icon }) => {
                const active = pathname === href
                return (
                  <Button
                    key={href}
                    as={NextLink}
                    href={href}
                    variant={active ? 'solid' : 'ghost'}
                    colorScheme={active ? 'brand' : 'gray'}
                    size="sm"
                    borderRadius="full"
                    leftIcon={<Icon as={icon} boxSize={3.5} />}
                    fontWeight="600"
                  >
                    {label}
                  </Button>
                )
              })}
            </HStack>
          </Show>

          <Show above="lg">
            <HStack spacing={2}>
              <Button
                as={Link}
                href="https://p2p.binance.com"
                isExternal
                size="sm"
                variant="outline"
                borderRadius="full"
                borderColor="surface.border"
                leftIcon={<FaExternalLinkAlt size={12} />}
              >
                Binance P2P
              </Button>
              <IconButton
                aria-label="Cerrar sesión"
                icon={<FaSignOutAlt />}
                size="sm"
                variant="ghost"
                borderRadius="full"
                onClick={handleLogout}
              />
            </HStack>
          </Show>

          <Show below="lg">
            <IconButton
              aria-label="Abrir menú"
              icon={<FaBars />}
              variant="ghost"
              borderRadius="xl"
              onClick={onOpen}
            />
          </Show>
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderTopLeftRadius="2xl" borderBottomLeftRadius="2xl">
          <DrawerCloseButton borderRadius="full" />
          <DrawerHeader fontWeight="700">Menú</DrawerHeader>
          <DrawerBody pb={8}>
            <VStack align="stretch" spacing={2}>
              {NAV_LINKS.map(({ href, label, icon }) => {
                const active = pathname === href
                return (
                  <Button
                    key={href}
                    as={NextLink}
                    href={href}
                    onClick={onClose}
                    variant={active ? 'solid' : 'ghost'}
                    colorScheme={active ? 'brand' : 'gray'}
                    justifyContent="flex-start"
                    leftIcon={<Icon as={icon} />}
                    borderRadius="xl"
                    size="md"
                  >
                    {label}
                  </Button>
                )
              })}
              <Button
                as={Link}
                href="https://p2p.binance.com"
                isExternal
                variant="outline"
                borderRadius="xl"
                leftIcon={<FaExternalLinkAlt />}
                onClick={onClose}
                mt={2}
              >
                Ir a Binance P2P
              </Button>
              <Button
                variant="ghost"
                colorScheme="red"
                borderRadius="xl"
                leftIcon={<FaSignOutAlt />}
                onClick={() => {
                  onClose()
                  handleLogout()
                }}
                mt={2}
              >
                Salir
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
