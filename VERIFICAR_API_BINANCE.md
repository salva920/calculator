# Verificación de API de Binance para Chat/Imágenes

## Endpoint Oficial que Usamos

Actualmente usamos el endpoint oficial:
- `GET /sapi/v1/c2c/orderMatch/listUserOrderHistory`
- Documentación: https://binance-docs.github.io/apidocs/spot/en/#get-c2c-trade-history-user_data

## ¿Qué Información Devuelve?

Según la documentación oficial, este endpoint devuelve:
- `orderNumber`: Número de orden
- `advNo`: Número de anuncio
- `tradeType`: Tipo de operación (BUY/SELL)
- `asset`: Activo (USDT)
- `fiat`: Moneda fiat (VES)
- `fiatAmount`: Cantidad en fiat
- `amount`: Cantidad en crypto
- `totalPrice`: Precio total
- `unitPrice`: Precio unitario
- `orderStatus`: Estado de la orden
- `createTime`: Fecha de creación
- `commission`: Comisión
- `counterPartName`: Nombre del contraparte
- `paymentMethod`: Método de pago

## ¿Incluye Chat o Imágenes?

**NO**, según la documentación oficial, este endpoint NO incluye:
- Mensajes del chat
- Imágenes de comprobantes
- Archivos adjuntos
- URLs de imágenes

## Endpoints No Documentados

Los endpoints que intentamos usar anteriormente NO están documentados:
- `/sapi/v1/c2c/orderMatch/getOrderChat` - No existe en documentación oficial
- `/sapi/v1/c2c/orderMatch/getOrderDetail` - No existe en documentación oficial
- `/bapi/c2c/v1/friendly/c2c/order/getOrderDetail` - Endpoint público no oficial

## Recomendación

1. **Verificar la respuesta real**: Podríamos hacer una prueba para ver qué campos adicionales devuelve el endpoint oficial (a veces hay campos no documentados)

2. **Usar solo endpoints oficiales**: Si Binance agrega soporte para chat/imágenes en el futuro, lo harán a través de endpoints oficiales documentados

3. **Mantener subida manual**: La subida manual es segura y no viola términos de servicio

## Verificación Realizada ✅

Se verificó la respuesta real del endpoint oficial y se confirmó que **NO incluye campos relacionados con chat o imágenes**:

**Campos disponibles en la respuesta:**
- `orderNumber`, `advNo`, `tradeType`, `asset`, `fiat`, `fiatSymbol`
- `amount`, `totalPrice`, `unitPrice`, `orderStatus`, `createTime`
- `commission`, `takerCommissionRate`, `takerCommission`, `takerAmount`
- `counterPartNickName`, `payMethodName`, `additionalKycVerify`

**Campos NO disponibles:**
- ❌ `chat`, `messages`, `image`, `attachment`, `receipt`
- ❌ Cualquier campo relacionado con el contenido del chat

## Bloqueo geográfico en Vercel (ubicación restringida)

Si en los logs de Vercel aparece:

`Service unavailable from a restricted location according to 'b. Eligibility'`

**No es un bug de la app.** Binance rechaza peticiones desde los servidores de Vercel (EE.UU./Europa). Las API keys están bien; el **origen de la IP** no lo está.

### Qué hacer

1. **Sincronizar desde tu PC (recomendado)**  
   - `npm run dev` y deja la pestaña abierta (sync cada 2 min), o  
   - `npm run sync:local` con el dev server corriendo.  
   Los datos van a MongoDB y el dashboard en Vercel los muestra.

2. **Proxy en Vercel**  
   Variable `BINANCE_HTTP_PROXY` con un proxy HTTP en región permitida (ej. Venezuela).

3. **Solo consultar en Vercel**  
   Métricas e historial leen MongoDB. Sin sync reciente, “hoy” puede verse vacío.

---

## Conclusión

La API oficial de Binance **NO proporciona acceso a imágenes del chat** a través del endpoint `listUserOrderHistory` ni ningún otro endpoint documentado. 

**La única forma segura y legal de validar comprobantes es mediante la subida manual de imágenes**, que es la funcionalidad que hemos implementado.

