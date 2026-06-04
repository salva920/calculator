# Binance P2P Calculator

Una calculadora avanzada para calcular ganancias en transacciones P2P de Binance USDT/VES en el mercado venezolano.

## 🏗️ Arquitectura

- **Frontend**: Next.js 14 con App Router
- **UI**: Chakra UI + Framer Motion
- **Estado**: TanStack Query (React Query)
- **APIs**: Binance API para precios en tiempo real
- **Lenguaje**: TypeScript

## 🚀 Características

- **Cálculo Automático**: Ganancias brutas y netas calculadas automáticamente
- **Precios en Tiempo Real**: Integración con API de Binance
- **Precios Variables**: Soporte para márgenes variables del precio de mercado
- **Comisiones Bancarias**: Cálculo de comisiones por porcentaje o monto fijo
- **Análisis de Rentabilidad**: ROI, margen de ganancia y recomendaciones
- **UI Moderna**: Interfaz responsiva con animaciones suaves
- **Gráficos Interactivos**: Visualización de datos con Recharts
- **🆕 Conexión con Binance**: Conecta tu cuenta de Binance para sincronizar transacciones automáticamente
- **🆕 Sincronización Automática**: Registra automáticamente cada movimiento P2P desde tu cuenta
- **🆕 Gestión de Objetivos**: Crea y rastrea objetivos de ganancias, órdenes y volumen
- **🆕 Seguimiento de Progreso**: Visualiza tu progreso hacia los objetivos en tiempo real

## 📁 Estructura del Proyecto

```
├── .next/                 # Build de Next.js (generado)
├── node_modules/          # Dependencias
├── public/               # Archivos estáticos
├── src/
│   └── app/              # App Router de Next.js
│       ├── layout.tsx    # Layout principal
│       ├── page.tsx      # Página principal
│       ├── providers.tsx # Providers de Chakra UI y TanStack Query
│       └── globals.css   # Estilos globales
├── src/components/       # Componentes reutilizables
│   ├── CalculatorForm.tsx    # Formulario de cálculo
│   ├── ResultsDisplay.tsx    # Visualización de resultados
│   └── Navigation.tsx        # Barra de navegación
├── src/hooks/           # Hooks personalizados
│   └── useBinancePrice.ts   # Hook para precios de Binance
├── src/lib/             # Utilidades y configuración
│   └── theme.ts         # Tema de Chakra UI
├── src/utils/           # Utilidades de cálculo
│   └── calculations.ts  # Lógica de cálculo de ganancias
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración TypeScript
└── README.md           # Documentación
```

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd binance-p2p-calculator
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 💡 Cómo Usar

### 🆕 Conexión con Binance y Sincronización Automática

#### Configurar Conexión

1. **Obtener Credenciales de API de Binance**
   - Ve a [Binance.com](https://www.binance.com) → API Management
   - Crea una nueva API Key con permisos de **lectura solamente**
   - Guarda tu API Key y Secret Key (solo se muestra una vez)
   - Para más detalles, consulta [BINANCE_SETUP.md](./BINANCE_SETUP.md)

2. **Conectar en la Aplicación**
   - Ve a la sección "Conexión con Binance" en la página principal
   - Ingresa tu API Key y API Secret
   - Haz clic en "Conectar Cuenta"
   - La aplicación verificará las credenciales automáticamente

3. **Sincronizar Transacciones**
   - Una vez conectado, haz clic en "Sincronizar Ahora"
   - Las transacciones P2P de las últimas 24 horas se sincronizarán automáticamente
   - Las transacciones se procesan y se calculan las ganancias automáticamente

#### Gestión de Objetivos

1. **Crear un Objetivo**
   - Ve a la sección "Objetivos" en la página principal
   - Haz clic en "Nuevo Objetivo"
   - Selecciona el tipo de objetivo:
     - **Ganancia (VES)**: Objetivo de ganancia neta en bolívares
     - **Número de Órdenes**: Objetivo de cantidad de transacciones
     - **Volumen (USDT)**: Objetivo de volumen total en USDT
     - **BTC 30 días**: Objetivo de BTC en los últimos 30 días
     - **BTC Total**: Objetivo de BTC total acumulado
   - Ingresa el valor objetivo y fecha límite (opcional)
   - El progreso se actualiza automáticamente

2. **Ver Progreso**
   - Los objetivos muestran el progreso en tiempo real
   - Se actualizan automáticamente cuando se sincronizan nuevas transacciones
   - Los objetivos completados se marcan automáticamente

### 1. Configurar la Transacción (Manual)
- **Cantidad de USDT**: Ingresa la cantidad de USDT que deseas transaccionar
- **Precio de Compra**: Establece el precio de compra (fijo o variable)
- **Precio de Venta**: Establece el precio de venta (fijo o variable)
- **Comisiones**: Configura las comisiones bancarias y de Binance

### 2. Precios Variables
- Selecciona "Variable" para usar márgenes del precio de mercado
- La aplicación obtendrá automáticamente el precio actual de Binance
- Aplica el margen especificado (ej: 95% para compra, 105% para venta)

### 3. Análisis de Resultados
- **Ganancia Bruta**: Diferencia entre ingresos y costos de inversión
- **Ganancia Neta**: Ganancia bruta menos todas las comisiones
- **ROI**: Retorno sobre la inversión en porcentaje
- **Margen de Ganancia**: Porcentaje de ganancia sobre los ingresos

## 📊 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar linter

## 🎨 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Chakra UI** - Biblioteca de componentes
- **Framer Motion** - Animaciones
- **TanStack Query** - Gestión de estado del servidor
- **Recharts** - Gráficos interactivos

### APIs Externas
- **Binance API** - Precios en tiempo real de USDT
- **DolarToday API** - Tasa de cambio USD/VES (opcional)

### Herramientas de Desarrollo
- **ESLint** - Linter de código
- **Prettier** - Formateador de código
- **Axios** - Cliente HTTP para APIs

## 🧮 Fórmulas de Cálculo

### Ganancia Bruta
```
Ganancia Bruta = (Precio de Venta - Precio de Compra) × Cantidad de USDT
```

### Ganancia Neta
```
Ganancia Neta = Ganancia Bruta - (Comisión Bancaria + Comisión de Binance)
```

### ROI (Return on Investment)
```
ROI = (Ganancia Neta / Inversión Total) × 100
```

### Margen de Ganancia
```
Margen de Ganancia = (Ganancia Neta / Ingresos Totales) × 100
```

### Precio Variable
```
Precio Variable = Precio de Mercado × (Margen / 100)
```

## 🔧 Configuración Avanzada

### Integración con APIs
- **Binance API**: Obtiene precios en tiempo real de USDT
- **DolarToday API**: Tasa de cambio USD/VES para el mercado venezolano
- **Fallback**: Precios simulados cuando las APIs no están disponibles

### Hooks Personalizados
- `useBinancePrice()` - Obtener precio actual de USDT desde Binance
- `useVenezuelanPrice()` - Obtener tasa de cambio USD/VES

### Utilidades de Cálculo
- `calculateProfits()` - Cálculo principal de ganancias
- `calculateVariablePrice()` - Precio con margen variable
- `calculateMinimumSellPrice()` - Precio mínimo de venta rentable
- `calculateMaximumBuyPrice()` - Precio máximo de compra rentable

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar el repositorio con Vercel
2. Desplegar automáticamente
3. No requiere configuración adicional

### Otras Plataformas
El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- AWS Amplify
- Railway
- Heroku

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Si tienes alguna pregunta o necesitas ayuda, por favor:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

Desarrollado con ❤️ para traders P2P de Binance en Venezuela
