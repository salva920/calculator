# Guía Rápida: Verificar Credenciales de Binance

## ⚠️ Problema Actual

Estás recibiendo el error **-1022: "Signature for this request is not valid"**. Esto significa que Binance no puede validar tu solicitud.

## 🔍 Verificación Rápida

### Paso 1: Verifica en Binance

1. **Ve a Binance API Management**
   - URL: https://www.binance.com/en/my/settings/api-management
   - Inicia sesión en tu cuenta

2. **Verifica tu API Key**
   - ¿Está activa?
   - ¿Tiene "Enable Reading" habilitado?
   - ¿Hay restricciones de IP? (Si sí, desactívalas temporalmente para probar)

### Paso 2: Verifica las Credenciales

Las credenciales que compartiste anteriormente:
- **API Key**: `5bC5LMgOSpS6jnHL5pEK3M2Zy7ztA3RSo9n7AWHfXgNjjIP1JEfO6xfICZKeyRF7`
- **API Secret**: `BkZUzMiunlgQCOi0laD6ZQZAGIChffiODPdXJacglJAQFkHsp3W9ZM9xSRfQTqK5BkZUzMiunlgQCOi0laD6ZQZAGIChffiODPdXJacglJAQFkHsp3W9ZM9xSRfQTqK5`

**⚠️ IMPORTANTE**: Como estas credenciales fueron compartidas públicamente, es muy probable que:
- Hayan sido revocadas automáticamente por Binance
- Necesites crear nuevas credenciales

### Paso 3: Crear Nuevas Credenciales (Recomendado)

1. **Elimina la API Key actual** (si existe)
   - Ve a API Management
   - Haz clic en "Delete" en la API Key antigua

2. **Crea una nueva API Key**
   - Haz clic en "Create API"
   - Selecciona "System generated"
   - Nombre: "P2P Calculator"
   - Completa la verificación de seguridad

3. **Configura permisos**
   - ✅ **Enable Reading** (SOLO esto)
   - ❌ Desactiva todo lo demás

4. **Configura restricciones**
   - Para desarrollo: **Desactiva** restricciones de IP
   - Para producción: Agrega IPs específicas

5. **Copia las nuevas credenciales**
   - API Key: Copia inmediatamente
   - Secret Key: **Solo se muestra una vez** - cópialo y guárdalo seguro

6. **Prueba en la aplicación**
   - Ingresa las nuevas credenciales
   - Intenta conectar

## 🧪 Prueba Manual

Si quieres verificar que tus credenciales funcionan, puedes usar este comando en PowerShell:

```powershell
# Reemplaza con tus credenciales
$apiKey = "TU_API_KEY"
$apiSecret = "TU_API_SECRET"
$timestamp = [Math]::Floor([decimal](Get-Date -UFormat %s)) * 1000
$queryString = "recvWindow=5000&timestamp=$timestamp"

# Generar firma (requiere tener Node.js disponible)
# O usa una herramienta online como: https://www.freeformatter.com/hmac-generator.html
```

## ✅ Checklist de Verificación

Antes de intentar conectar, verifica:

- [ ] La API Key está activa en Binance
- [ ] "Enable Reading" está habilitado
- [ ] No hay restricciones de IP (o tu IP está permitida)
- [ ] Las credenciales fueron copiadas sin espacios
- [ ] La API Key no fue revocada
- [ ] Estás usando las credenciales más recientes

## 🆘 Si Nada Funciona

1. **Crea una API Key completamente nueva**
2. **Verifica que no haya restricciones**
3. **Prueba desde otra red/IP** (para descartar problemas de red)
4. **Espera unos minutos** (puede haber un delay en Binance)

## 📝 Nota de Seguridad

**NUNCA compartas tus credenciales públicamente**. Si lo hiciste:
1. Revoca la API Key inmediatamente
2. Crea una nueva
3. No la compartas nunca más

