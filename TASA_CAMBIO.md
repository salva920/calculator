# Actualización de Tasa de Cambio USDT/VES

## 📊 Tasa Actual
- **Tasa Base**: 254.99 VES por USDT
- **Fuente**: Binance P2P (https://p2p.binance.com/es)
- **Última Actualización**: Manual

## 🔄 Cómo Actualizar la Tasa

### Método 1: Actualización Manual
1. Ve a [Binance P2P](https://p2p.binance.com/es)
2. Selecciona USDT/VES
3. Revisa el precio promedio de las ofertas
4. Actualiza el archivo `src/app/api/binance/price/route.ts`
5. Cambia la variable `currentVesRate` en la línea 8

### Método 2: Verificación Automática
La aplicación ajusta automáticamente la tasa basada en:
- **Precio de BTC**: Si BTC > $100k, aumenta 1%
- **Precio de BTC**: Si BTC < $50k, reduce 1%
- **Volatilidad del mercado**: Ajustes dinámicos

## 📈 Fuentes de Datos

### Primaria
- **Binance P2P**: Precio real del mercado venezolano
- **Actualización**: Manual (recomendado diario)

### Secundaria
- **Binance API**: Precio de BTC/USDT para ajustes
- **Actualización**: Automática cada 30 segundos

## ⚠️ Consideraciones Importantes

1. **Mercado Volátil**: El VES es muy volátil, actualiza frecuentemente
2. **Horarios**: El mercado P2P es más activo en horarios específicos
3. **Métodos de Pago**: Diferentes métodos tienen precios diferentes
4. **Límites**: Considera los límites de las órdenes

## 🛠️ Implementación Técnica

```typescript
// En src/app/api/binance/price/route.ts
const currentVesRate = 254.99 // ← Actualizar aquí

// Ajuste automático basado en BTC
if (btcPrice > 100000) {
  adjustmentFactor = 1.01 // +1%
} else if (btcPrice < 50000) {
  adjustmentFactor = 0.99 // -1%
}
```

## 📱 Monitoreo

La aplicación muestra:
- **Tasa actual**: En tiempo real
- **Fuente**: Binance P2P
- **Última actualización**: Timestamp
- **Ajuste aplicado**: Factor de corrección

## 🔗 Enlaces Útiles

- [Binance P2P Venezuela](https://p2p.binance.com/es)
- [Precio BTC en tiempo real](https://www.binance.com/es/trade/BTC_USDT)
- [API de Binance](https://binance-docs.github.io/apidocs/spot/en/)


