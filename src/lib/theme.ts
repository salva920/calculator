import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    surface: {
      bg: '#f1f5f9',
      card: '#ffffff',
      muted: '#f8fafc',
      border: '#e2e8f0',
      hover: '#f1f5f9',
    },
    crypto: {
      bitcoin: '#F7931A',
      binance: '#F0B90B',
      usdt: '#26A17B',
    },
  },
  fonts: {
    heading: 'var(--font-jakarta), system-ui, sans-serif',
    body: 'var(--font-jakarta), system-ui, sans-serif',
  },
  radii: {
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
  },
  shadows: {
    card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)',
    float: '0 12px 40px rgba(15, 23, 42, 0.12)',
    nav: '0 4px 24px rgba(15, 23, 42, 0.08)',
  },
  styles: {
    global: {
      body: {
        bg: 'surface.bg',
        color: 'gray.800',
        lineHeight: '1.6',
      },
      'html, body': {
        overflowX: 'hidden',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        nav: {
          borderRadius: 'full',
          fontWeight: '600',
          fontSize: 'sm',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'surface.card',
          borderWidth: '1px',
          borderColor: 'surface.border',
          borderRadius: '2xl',
          boxShadow: 'card',
          overflow: 'hidden',
        },
      },
    },
    Input: {
      defaultProps: {
        variant: 'filled',
      },
      variants: {
        filled: {
          field: {
            bg: 'surface.muted',
            borderRadius: 'xl',
            borderWidth: '1px',
            borderColor: 'transparent',
            _hover: { bg: 'surface.hover' },
            _focus: {
              bg: 'white',
              borderColor: 'brand.400',
              boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)',
            },
          },
        },
      },
    },
    Select: {
      defaultProps: {
        variant: 'filled',
      },
      variants: {
        filled: {
          field: {
            bg: 'surface.muted',
            borderRadius: 'xl',
            borderWidth: '1px',
            borderColor: 'transparent',
            _hover: { bg: 'surface.hover' },
            _focus: {
              bg: 'white',
              borderColor: 'brand.400',
              boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)',
            },
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2.5,
        py: 0.5,
        fontWeight: '600',
        fontSize: 'xs',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.02em',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            bg: 'surface.muted',
            color: 'gray.600',
            fontSize: 'xs',
            textTransform: 'none',
            letterSpacing: 'normal',
            borderColor: 'surface.border',
          },
          td: {
            borderColor: 'surface.border',
          },
        },
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
        },
      },
    },
  },
})

export default theme
