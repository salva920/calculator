export interface FormData {
  usdtAmount: number
  buyPrice: number
  sellPrice: number
  buyPriceType: 'fixed' | 'variable'
  sellPriceType: 'fixed' | 'variable'
  buyPriceMargin: number
  sellPriceMargin: number
  bankCommission: number
  bankCommissionType: 'percentage' | 'fixed'
  binanceCommission: number
  // Proyecciones avanzadas
  cyclesPerDay: number
  workingDaysPerMonth: number
  currentOrders: number
  targetOrders: number
  currentBtc30Days: number
  targetBtc30Days: number
  currentBtcTotal: number
  targetBtcTotal: number
}

export interface CalculationResults {
  grossProfit: number
  netProfit: number
  totalCosts: number
  profitMargin: number
  roi: number
  bankCommissionAmount: number
  binanceCommissionAmount: number
  totalInvestment: number
  totalRevenue: number
}

export function calculateProfits(formData: FormData): CalculationResults {
  const {
    usdtAmount,
    buyPrice,
    sellPrice,
    bankCommission,
    bankCommissionType,
    binanceCommission
  } = formData

  // Calcular inversión total (compra)
  const totalInvestment = usdtAmount * buyPrice

  // Calcular ingresos totales (venta)
  const totalRevenue = usdtAmount * sellPrice

  // Calcular ganancia bruta
  const grossProfit = totalRevenue - totalInvestment

  // Calcular comisión bancaria
  const bankCommissionAmount = bankCommissionType === 'percentage'
    ? (totalRevenue * bankCommission) / 100
    : bankCommission

  // Comisión de Binance (generalmente 0, pero puede haber fees implícitos)
  const binanceCommissionAmount = binanceCommission

  // Calcular costos totales
  const totalCosts = bankCommissionAmount + binanceCommissionAmount

  // Calcular ganancia neta
  const netProfit = grossProfit - totalCosts

  // Calcular margen de ganancia (porcentaje sobre los ingresos)
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Calcular ROI (Return on Investment)
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0

  return {
    grossProfit,
    netProfit,
    totalCosts,
    profitMargin,
    roi,
    bankCommissionAmount,
    binanceCommissionAmount,
    totalInvestment,
    totalRevenue
  }
}

// Función para calcular el precio con margen variable
export function calculateVariablePrice(marketPrice: number, margin: number): number {
  return (marketPrice * margin) / 100
}

// Función para validar si una transacción es rentable
export function isTransactionProfitable(results: CalculationResults): boolean {
  return results.netProfit > 0
}

// Función para obtener recomendaciones basadas en los resultados
export function getRecommendations(results: CalculationResults): string[] {
  const recommendations: string[] = []

  if (results.netProfit < 0) {
    recommendations.push('Esta transacción resultaría en pérdida. Considera ajustar los precios.')
  }

  if (results.profitMargin < 2) {
    recommendations.push('Margen muy bajo. El riesgo puede no valer la pena.')
  }

  if (results.profitMargin > 5 && results.profitMargin < 10) {
    recommendations.push('Margen moderado. Transacción viable.')
  }

  if (results.profitMargin > 10) {
    recommendations.push('Excelente margen. Oportunidad muy atractiva.')
  }

  if (results.bankCommissionAmount > results.grossProfit * 0.5) {
    recommendations.push('Las comisiones bancarias son muy altas. Considera cambiar de banco.')
  }

  if (results.roi > 20) {
    recommendations.push('ROI muy alto. Excelente oportunidad de inversión.')
  }

  return recommendations
}

// Función para calcular el precio mínimo de venta para ser rentable
export function calculateMinimumSellPrice(
  usdtAmount: number,
  buyPrice: number,
  bankCommission: number,
  bankCommissionType: 'percentage' | 'fixed',
  binanceCommission: number
): number {
  const totalInvestment = usdtAmount * buyPrice
  const binanceCommissionAmount = binanceCommission
  
  // Si la comisión es porcentual, necesitamos resolver la ecuación:
  // sellPrice * usdtAmount - (sellPrice * usdtAmount * bankCommission / 100) - binanceCommission >= totalInvestment
  // sellPrice * usdtAmount * (1 - bankCommission / 100) >= totalInvestment + binanceCommission
  // sellPrice >= (totalInvestment + binanceCommission) / (usdtAmount * (1 - bankCommission / 100))
  
  if (bankCommissionType === 'percentage') {
    const denominator = usdtAmount * (1 - bankCommission / 100)
    return (totalInvestment + binanceCommissionAmount) / denominator
  } else {
    // Si es monto fijo
    return (totalInvestment + bankCommission + binanceCommissionAmount) / usdtAmount
  }
}

// Función para calcular el precio máximo de compra para ser rentable
export function calculateMaximumBuyPrice(
  usdtAmount: number,
  sellPrice: number,
  bankCommission: number,
  bankCommissionType: 'percentage' | 'fixed',
  binanceCommission: number
): number {
  const totalRevenue = usdtAmount * sellPrice
  const binanceCommissionAmount = binanceCommission
  
  let bankCommissionAmount: number
  if (bankCommissionType === 'percentage') {
    bankCommissionAmount = (totalRevenue * bankCommission) / 100
  } else {
    bankCommissionAmount = bankCommission
  }
  
  const netRevenue = totalRevenue - bankCommissionAmount - binanceCommissionAmount
  
  return netRevenue / usdtAmount
}
