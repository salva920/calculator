# Solución de Error de Firma de Binance (-1022)

## Error: "Signature for this request is not valid"

Este error ocurre cuando Binance no puede validar la firma de tu solicitud. Aquí están las causas más comunes y sus soluciones:

## Causas y Soluciones

### 1. API Key o Secret Incorrectos

**Síntomas:**
- Error -1022 al intentar conectar
- "Signature for this request is not valid"

**Solución:**
1. Ve a [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Verifica que copiaste correctamente:
   - **API Key**: Debe comenzar con letras y números, sin espacios
   - **API Secret**: Debe ser la clave secreta completa, sin espacios al inicio o final
3. Si no estás seguro, crea una nueva API Key:
   - Elimina la antigua
   - Crea una nueva con permisos de lectura
   - Copia la nueva API Key y Secret

### 2. Permisos Insuficientes

**Síntomas:**
- Error al verificar credenciales
- La API Key existe pero no funciona

**Solución:**
1. Ve a API Management en Binance
2. Haz clic en "Edit" en tu API Key
3. Asegúrate de que esté habilitado:
   - ✅ **Enable Reading** (Requerido)
   - ❌ Enable Spot & Margin Trading (NO necesario)
   - ❌ Enable Withdrawals (NO necesario)
4. Guarda los cambios

### 3. Restricciones de IP

**Síntomas:**
- Funciona desde algunas IPs pero no desde otras
- Error de autenticación

**Solución:**
1. Ve a API Management → Editar tu API Key
2. En "Restrict access to trusted IPs only":
   - **Opción A (Desarrollo)**: Desactiva la restricción temporalmente
   - **Opción B (Producción)**: Agrega tu IP actual a la lista de IPs permitidas
3. Para obtener tu IP actual, visita: https://whatismyipaddress.com/

### 4. API Key Revocada o Expirada

**Síntomas:**
- La API Key funcionaba antes pero ahora no
- Error de autenticación

**Solución:**
1. Verifica en Binance si la API Key sigue activa
2. Si fue revocada, crea una nueva
3. Si expiró, renueva los permisos

### 5. Problema de Sincronización de Tiempo

**Síntomas:**
- Error intermitente
- Funciona a veces pero no siempre

**Solución:**
- El código ahora incluye `recvWindow` para manejar diferencias de tiempo
- Si el problema persiste, verifica que el reloj de tu sistema esté sincronizado

## Verificación Paso a Paso

### Paso 1: Verificar Credenciales Manualmente

1. Ve a Binance → API Management
2. Verifica que tu API Key esté activa
3. Copia nuevamente la API Key y Secret
4. Asegúrate de no tener espacios al inicio o final

### Paso 2: Verificar Permisos

1. En API Management, haz clic en "Edit" en tu API Key
2. Verifica que "Enable Reading" esté activado
3. Si hay restricciones de IP, agrega tu IP o desactívalas temporalmente

### Paso 3: Probar en la Aplicación

1. Abre la aplicación
2. Ve a "Conexión con Binance"
3. Ingresa tu API Key y Secret (sin espacios)
4. Haz clic en "Conectar Cuenta"

### Paso 4: Revisar Logs

Si el error persiste, revisa la consola del servidor para ver el error específico:
- Error -1022: Firma inválida (credenciales o formato)
- Error -2015: IP no permitida
- Error -2010: Permisos insuficientes

## Crear Nueva API Key (Si Nada Funciona)

Si después de intentar todo lo anterior sigue sin funcionar:

1. **Elimina la API Key actual**
   - Ve a API Management
   - Haz clic en "Delete" en tu API Key actual

2. **Crea una nueva API Key**
   - Haz clic en "Create API"
   - Selecciona "System generated"
   - Nombre: "P2P Calculator"
   - Completa la verificación de seguridad

3. **Configura permisos**
   - ✅ Enable Reading
   - ❌ Desactiva todo lo demás

4. **Configura restricciones (opcional)**
   - Para desarrollo: Desactiva restricciones de IP
   - Para producción: Agrega IPs específicas

5. **Copia las nuevas credenciales**
   - API Key: Copia inmediatamente
   - Secret Key: Solo se muestra una vez, cópialo y guárdalo seguro

6. **Prueba en la aplicación**
   - Ingresa las nuevas credenciales
   - Intenta conectar

## Notas Importantes

- ⚠️ **Nunca compartas tu API Secret públicamente**
- ⚠️ **Si compartiste tu Secret, revoca la API Key inmediatamente y crea una nueva**
- ✅ **Solo habilita permisos de lectura para mayor seguridad**
- ✅ **Usa restricciones de IP en producción**

## Contacto

Si después de seguir todos estos pasos el problema persiste, puede ser un problema temporal de Binance. Intenta de nuevo en unos minutos.

