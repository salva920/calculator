/**
 * Configuración de comisiones bancarias por método de pago
 * Estas comisiones son típicas en Venezuela, pero pueden ajustarse
 */

export interface PaymentCommissionConfig {
  method: string // Nombre del método de pago (ej: "Pago Móvil", "Banesco", etc.)
  commission: number // Porcentaje de comisión
  commissionType: 'percentage' | 'fixed' // Tipo de comisión
  fixedAmount?: number // Si es fixed, el monto fijo
}

// Configuración por defecto de comisiones
// Se pueden ajustar según las comisiones reales de cada banco/método
export const PAYMENT_COMMISSIONS: PaymentCommissionConfig[] = [
  {
    method: 'Pago Móvil',
    commission: 0.3, // Pago Móvil cobra 0.3% de comisión
    commissionType: 'percentage',
  },
  {
    method: 'Transferencia a banco específico',
    commission: 0.3, // Transferencia a banco específico cobra 0.3% de comisión (misma que Pago Móvil)
    commissionType: 'percentage',
  },
  {
    method: 'Transferencia bancaria',
    commission: 0, // Transferencia bancaria general cobra 0 de comisión
    commissionType: 'percentage',
  },
  {
    method: 'Banesco',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Mercantil',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Banco de Venezuela',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Bancamiga',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: '100% Banco',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Venezuela',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'BBVA',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'BNC',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Banplus',
    commission: 0, // Solo nombre del banco = transferencia al mismo banco (sin comisión)
    commissionType: 'percentage',
  },
  {
    method: 'Provincial',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'Banco Del Tesoro',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'BDDT',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'Bancaribe',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'Banco Plaza',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'Plaza',
    commission: 0,
    commissionType: 'percentage',
  },
  {
    method: 'BANK',
    commission: 0,
    commissionType: 'percentage',
  },
]

/** Comisión Pago Móvil P2P persona a persona (hasta 0,30% del monto en Bs). */
export const PAGO_MOVIL_FEE_PERCENT = 0.3

export function isPagoMovilMethod(paymentMethod: string | null | undefined): boolean {
  if (!paymentMethod) return false
  const n = paymentMethod.trim().toLowerCase().replace(/\s+/g, '')
  return n.includes('pagomovil') || n.includes('pagomóvil') || n.includes('pago_movil')
}

/**
 * Obtiene la configuración de comisión para un método de pago
 */
export function getPaymentCommission(paymentMethod: string | null | undefined): PaymentCommissionConfig {
  if (!paymentMethod) {
    // Por defecto, asumir transferencia bancaria con 0.3%
    return {
      method: 'Transferencia Bancaria',
      commission: 0.3,
      commissionType: 'percentage',
    }
  }

  // Normalizar el nombre del método de pago (minúsculas, sin espacios extra)
  const normalizedMethod = paymentMethod.trim().toLowerCase()

  // PRIMERO: Verificar si contiene palabras clave especiales
  if (isPagoMovilMethod(paymentMethod)) {
    return PAYMENT_COMMISSIONS.find((c) => c.method === 'Pago Móvil') || {
      method: 'Pago Móvil',
      commission: PAGO_MOVIL_FEE_PERCENT,
      commissionType: 'percentage',
    }
  }

  // SEGUNDO: Verificar si es transferencia a banco específico o transferencia bancaria
  // Si dice "transferencia" entonces es transferencia entre bancos diferentes (0.3%)
  if (normalizedMethod.includes('transferencia') && normalizedMethod.includes('específico')) {
    return PAYMENT_COMMISSIONS.find((c) => c.method === 'Transferencia a banco específico') || {
      method: 'Transferencia a banco específico',
      commission: 0.3,
      commissionType: 'percentage',
    }
  }

  if (normalizedMethod.includes('transferencia')) {
    // Transferencia bancaria general (entre bancos diferentes) = 0.3%
    return PAYMENT_COMMISSIONS.find((c) => c.method === 'Transferencia bancaria') || {
      method: 'Transferencia bancaria',
      commission: 0.3,
      commissionType: 'percentage',
    }
  }

  // TERCERO: Si NO contiene "transferencia", verificar si es solo el nombre del banco
  // Si es solo el nombre del banco, es transferencia al mismo banco = 0% de comisión
  // Buscar coincidencia con bancos de la lista (prioridad: coincidencia exacta)
  const bankMatch = PAYMENT_COMMISSIONS.find((config) => {
    const configMethod = config.method.toLowerCase()
    // Coincidencia exacta
    if (normalizedMethod === configMethod) {
      return true
    }
    // Si el método contiene el nombre del banco (y no es una palabra muy corta)
    if (configMethod.length > 3 && normalizedMethod.includes(configMethod)) {
      return true
    }
    // Si el nombre del banco contiene el método (útil para variaciones)
    if (normalizedMethod.length > 3 && configMethod.includes(normalizedMethod)) {
      return true
    }
    return false
  })

  if (bankMatch) {
    // Si encontró un banco, usar su comisión configurada (0% para mismo banco)
    return bankMatch
  }

  // Por defecto: transferencia mismo banco / método desconocido = 0%
  // (solo Pago Móvil y transferencias marcadas aplican 0,30%)
  return {
    method: paymentMethod,
    commission: 0,
    commissionType: 'percentage',
  }
}

/**
 * Calcula el monto de la comisión bancaria para una transacción
 */
export function calculateBankCommission(
  amount: number, // Monto en VES o USDT según corresponda
  paymentMethod: string | null | undefined
): number {
  const config = getPaymentCommission(paymentMethod)

  if (config.commissionType === 'fixed') {
    return config.fixedAmount || 0
  }

  // Porcentaje
  return (amount * config.commission) / 100
}

/**
 * Actualiza la configuración de comisiones (para futuras ediciones manuales)
 */
export function updatePaymentCommission(config: PaymentCommissionConfig): void {
  const index = PAYMENT_COMMISSIONS.findIndex((c) => c.method === config.method)
  if (index >= 0) {
    PAYMENT_COMMISSIONS[index] = config
  } else {
    PAYMENT_COMMISSIONS.push(config)
  }
}

