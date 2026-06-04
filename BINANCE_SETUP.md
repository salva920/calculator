# Configuración de Binance API

Este documento explica cómo configurar la conexión con Binance para sincronizar automáticamente tus transacciones P2P.

## Requisitos Previos

1. Tener una cuenta activa en Binance
2. Habilitar la autenticación de dos factores (2FA) en tu cuenta de Binance
3. Acceso a la gestión de API Keys en Binance

## Pasos para Obtener las Credenciales de API

### 1. Acceder a API Management

1. Inicia sesión en [Binance.com](https://www.binance.com)
2. Ve a tu perfil (ícono de usuario en la esquina superior derecha)
3. Selecciona **"API Management"** o **"API"**

### 2. Crear una Nueva API Key

1. Haz clic en **"Create API"**
2. Selecciona **"System generated"** (recomendado)
3. Ingresa un nombre descriptivo, por ejemplo: "P2P Calculator"
4. Completa la verificación de seguridad (2FA, email, etc.)

### 3. Configurar Permisos

**IMPORTANTE:** Para que la sincronización funcione correctamente, necesitas habilitar los siguientes permisos:

- ✅ **Enable Reading** (Requerido)
- ❌ **Enable Spot & Margin Trading** (NO necesario, desactivar por seguridad)
- ❌ **Enable Withdrawals** (NO necesario, desactivar por seguridad)
- ❌ **Enable Futures** (NO necesario, desactivar por seguridad)

**Nota:** Solo habilita los permisos de lectura. Esto es suficiente para sincronizar tus transacciones P2P y mantener tu cuenta segura.

### 4. Restricciones de IP (Opcional pero Recomendado)

Para mayor seguridad, puedes restringir el acceso de la API Key a direcciones IP específicas:

1. En la configuración de la API Key, ve a **"Edit restrictions"**
2. Selecciona **"Restrict access to trusted IPs only"**
3. Agrega las IPs desde las que accederás a la aplicación

**Nota:** Si tu aplicación está en un servidor con IP dinámica, puedes omitir este paso, pero es menos seguro.

### 5. Obtener API Key y Secret

1. Después de crear la API Key, Binance te mostrará:
   - **API Key**: Una cadena de texto (guárdala de forma segura)
   - **Secret Key**: Solo se muestra UNA VEZ al crear la API (guárdala inmediatamente)

2. **IMPORTANTE:** Si pierdes el Secret Key, tendrás que crear una nueva API Key.

## Configurar en la Aplicación

1. Ve a la sección **"Conexión con Binance"** en la aplicación
2. Ingresa tu **API Key** y **API Secret**
3. Haz clic en **"Conectar Cuenta"**
4. La aplicación verificará que las credenciales sean válidas
5. Una vez conectado, podrás sincronizar tus transacciones P2P

## Sincronización Automática

La aplicación puede sincronizar automáticamente tus transacciones P2P:

- **Frecuencia:** Cada 5 minutos (configurable)
- **Datos sincronizados:**
  - Órdenes de compra y venta
  - Precios unitarios
  - Cantidades
  - Comisiones
  - Fechas y estados

## Seguridad

- Las credenciales se almacenan **encriptadas** en la base de datos
- Solo se usan para **lectura** de datos (no para trading)
- Puedes revocar la API Key en cualquier momento desde Binance
- Se recomienda usar restricciones de IP si es posible

## Solución de Problemas

### Error: "Permisos insuficientes"

**Solución:** Asegúrate de que tu API Key tenga habilitado **"Enable Reading"** y acceso a C2C.

### Error: "Las credenciales de Binance no son válidas"

**Soluciones:**
1. Verifica que copiaste correctamente la API Key y Secret
2. Asegúrate de que la API Key no haya sido revocada
3. Verifica que no hay restricciones de IP bloqueando el acceso

### No se sincronizan transacciones

**Posibles causas:**
1. No hay transacciones P2P recientes (últimas 24 horas)
2. Las transacciones son muy antiguas (la API solo obtiene las últimas)
3. Problemas de conectividad con la API de Binance

## Limitaciones de la API de Binance

- La API de Binance P2P tiene limitaciones de rate limiting
- Solo se pueden obtener transacciones de los últimos 30 días aproximadamente
- Algunos datos pueden no estar disponibles inmediatamente después de una transacción

## Soporte

Si tienes problemas con la configuración, consulta la [documentación oficial de Binance API](https://binance-docs.github.io/apidocs/spot/en/#introduction).

