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
  Heading,
  HStack,
  IconButton,
  Link,
  Spacer,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
  Badge,
  Hide,
  Show,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaBitcoin, FaBars, FaChartLine, FaExternalLinkAlt } from 'react-icons/fa'

const MotionBox = motion(Box)

const NAV_LINKS = [
  { href: '/', label: 'Resumen' },
  { href: '/calculadora', label: 'Calculadora' },
  { href: '/balance-diario', label: 'Balance Diario' },
  { href: '/conexion-binance', label: 'Conexión Binance' },
  { href: '/socios-capital', label: 'Socios capital' },
] as const

export default function Navigation() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const pathname = usePathname()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const navButtonProps = (href: string) => ({
    as: NextLink,
    href,
    variant: pathname === href ? 'solid' : 'ghost',
    colorScheme: pathname === href ? 'orange' : 'gray',
    size: 'sm' as const,
    justifyContent: 'flex-start' as const,
    w: 'full',
  })

  return (
    <MotionBox
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Box
        as="nav"
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        px={{ base: 3, md: 6 }}
        py={{ base: 2, md: 4 }}
        position="sticky"
        top={0}
        zIndex={1000}
        backdropFilter="blur(10px)"
      >
        <Flex align="center" maxW="container.xl" mx="auto" gap={2}>
          <NextLink href="/">
            <HStack spacing={2}>
              <FaBitcoin color="#F7931A" size={22} />
              <Heading
                as="span"
                size={{ base: 'sm', md: 'lg' }}
                bgGradient="linear(to-r, orange.400, yellow.400)"
                bgClip="text"
                lineHeight="shorter"
              >
                <Show above="sm">Binance P2P Calculator</Show>
                <Hide above="sm">P2P Calc</Hide>
              </Heading>
            </HStack>
          </NextLink>

          <Spacer />

          <Show above="lg">
            <VStack align="flex-end" spacing={2} ml={4}>
              <HStack spacing={2} flexWrap="wrap" justify="flex-end">
                <Badge colorScheme="green" fontSize="xs" px={2} py={0.5} rounded="full">
                  USDT/VES
                </Badge>
                <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5} rounded="full">
                  <HStack spacing={1}>
                    <FaChartLine size={10} />
                    <Text>Tiempo Real</Text>
                  </HStack>
                </Badge>
                <Button as={Link} href="https://p2p.binance.com" isExternal variant="outline" size="sm">
                  Ir a Binance P2P
                </Button>
              </HStack>
              <HStack spacing={1} flexWrap="wrap" justify="flex-end">
                {NAV_LINKS.map(({ href, label }) => (
                  <Button key={href} {...navButtonProps(href)}>
                    {label}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </Show>

          <Show below="lg">
            <IconButton
              aria-label="Abrir menú"
              icon={<FaBars />}
              variant="ghost"
              onClick={onOpen}
            />
          </Show>
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menú</DrawerHeader>
          <DrawerBody py={4}>
            <VStack align="stretch" spacing={2}>
              {NAV_LINKS.map(({ href, label }) => (
                <Button key={href} {...navButtonProps(href)} onClick={onClose}>
                  {label}
                </Button>
              ))}
              <Button
                as={Link}
                href="https://p2p.binance.com"
                isExternal
                variant="outline"
                leftIcon={<FaExternalLinkAlt />}
                onClick={onClose}
              >
                Ir a Binance P2P
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </MotionBox>
  )
}
