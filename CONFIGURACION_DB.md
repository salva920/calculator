# Configuración de Base de Datos MongoDB

## Problema Actual

Estás recibiendo errores de conexión a MongoDB porque la base de datos no está configurada correctamente.

## Solución

### Opción 1: MongoDB Atlas (Recomendado - Gratis)

1. **Crear cuenta en MongoDB Atlas**
   - Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Crea una cuenta gratuita

2. **Crear un Cluster**
   - Haz clic en "Build a Database"
   - Selecciona el plan "Free" (M0)
   - Elige una región cercana a ti
   - Crea el cluster (puede tomar unos minutos)

3. **Configurar Acceso**
   - Ve a "Database Access" en el menú lateral
   - Crea un nuevo usuario de base de datos:
     - Username: `admin` (o el que prefieras)
     - Password: Genera una contraseña segura y guárdala
     - Database User Privileges: "Atlas admin"
   - Haz clic en "Add User"

4. **Configurar Network Access**
   - Ve a "Network Access" en el menú lateral
   - Haz clic en "Add IP Address"
   - Para desarrollo local, puedes usar "Allow Access from Anywhere" (0.0.0.0/0)
   - **Nota:** En producción, usa solo IPs específicas

5. **Obtener Connection String**
   - Ve a "Database" en el menú lateral
   - Haz clic en "Connect" en tu cluster
   - Selecciona "Connect your application"
   - Copia la connection string (se verá así):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

6. **Configurar en tu aplicación**
   - Abre el archivo `.env` en tu proyecto
   - Reemplaza la línea `DATABASE_URL` con:
     ```env
     DATABASE_URL="mongodb+srv://admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/binance-p2p-calculator?retryWrites=true&w=majority"
     ```
   - Reemplaza:
     - `admin` con tu username
     - `TU_PASSWORD` con tu password
     - `cluster0.xxxxx` con el nombre de tu cluster
     - `binance-p2p-calculator` es el nombre de la base de datos (puedes cambiarlo)

### Opción 2: MongoDB Local

Si prefieres usar MongoDB localmente:

1. **Instalar MongoDB**
   - Descarga desde [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Instala MongoDB en tu máquina

2. **Configurar en .env**
   ```env
   DATABASE_URL="mongodb://localhost:27017/binance-p2p-calculator"
   ```

## Después de Configurar

1. **Actualizar Prisma**
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. **Reiniciar la aplicación**
   ```bash
   npm run dev
   ```

## Verificar Conexión

Si todo está bien configurado, deberías poder:
- Ver la aplicación sin errores de base de datos
- Conectar tu cuenta de Binance
- Crear objetivos
- Sincronizar transacciones

## Solución de Problemas

### Error: "no record found for Query"
- Verifica que la URL de MongoDB esté correcta en `.env`
- Asegúrate de que el usuario y contraseña sean correctos
- Verifica que el cluster esté activo en MongoDB Atlas

### Error: "Authentication failed"
- Verifica que el username y password sean correctos
- Asegúrate de que el usuario tenga permisos en MongoDB Atlas

### Error: "Network access denied"
- Ve a "Network Access" en MongoDB Atlas
- Asegúrate de que tu IP esté permitida (o usa 0.0.0.0/0 para desarrollo)





