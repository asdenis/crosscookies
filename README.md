# Aplicación Next.js 15 - Formulario Tickets Plus

Esta aplicación carga un formulario del sistema Tickets Plus del Gobierno de Mendoza en un iframe con sistema de debug exhaustivo.

## Características

- ✅ Next.js 15 con App Router
- ✅ Carga de formulario en iframe configurable
- ✅ Sistema de debug exhaustivo en tiempo real
- ✅ Manejo de errores y reintentos automáticos
- ✅ Verificación de conectividad de red
- ✅ Monitoreo de cookies y capacidades del navegador
- ✅ Configuración completa mediante variables de entorno
- ✅ Interfaz responsive con indicadores de carga

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno en `.env.local` (ya incluido)

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000)

## Configuración

### Variables de Entorno (.env.local)

#### URL del Formulario
- `NEXT_PUBLIC_FORM_BASE_URL`: URL base del formulario
- `NEXT_PUBLIC_FORM_PARAMS`: Parámetros codificados del formulario

#### Debug
- `NEXT_PUBLIC_DEBUG_MODE`: Habilitar/deshabilitar debug (true/false)
- `NEXT_PUBLIC_DEBUG_LEVEL`: Nivel de debug (verbose/normal)

#### Iframe
- `NEXT_PUBLIC_IFRAME_WIDTH`: Ancho del iframe (default: 100%)
- `NEXT_PUBLIC_IFRAME_HEIGHT`: Alto del iframe (default: 800px)
- `NEXT_PUBLIC_IFRAME_SANDBOX`: Permisos de sandbox del iframe

#### Red y Timeouts
- `NEXT_PUBLIC_LOAD_TIMEOUT`: Timeout de carga en ms (default: 30000)
- `NEXT_PUBLIC_RETRY_ATTEMPTS`: Número de reintentos (default: 3)
- `NEXT_PUBLIC_RETRY_DELAY`: Delay entre reintentos en ms (default: 2000)

## 🚀 Despliegue en Vercel

### Preparación para Vercel

1. **Configurar variables de entorno en Vercel:**
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega todas las variables de `.env.local`:

```bash
NEXT_PUBLIC_FORM_BASE_URL=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/com.ticketsplus.responderformularioif
NEXT_PUBLIC_FORM_PARAMS=tu_parametro_codificado_aqui
NEXT_PUBLIC_DEBUG_MODE=false  # Cambiar a false en producción
NEXT_PUBLIC_DEBUG_LEVEL=normal
NEXT_PUBLIC_IFRAME_WIDTH=100%
NEXT_PUBLIC_IFRAME_HEIGHT=800px
NEXT_PUBLIC_IFRAME_SANDBOX=allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation
NEXT_PUBLIC_LOAD_TIMEOUT=30000
NEXT_PUBLIC_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_DELAY=2000
```

2. **Desplegar:**
   - Conecta tu repositorio a Vercel
   - Vercel detectará automáticamente Next.js
   - El build se ejecutará automáticamente

### Verificaciones Pre-Despliegue ✅

- ✅ Next.js 15.0.3 (versión estable)
- ✅ TypeScript configurado correctamente
- ✅ Variables de entorno con prefijo NEXT_PUBLIC_
- ✅ Content Security Policy configurada
- ✅ Headers de seguridad implementados
- ✅ Manejo de errores robusto
- ✅ Componentes client-side marcados correctamente
- ✅ No hay dependencias de Node.js en el cliente
- ✅ Configuración de Vercel incluida (vercel.json)
- ✅ Build optimizado para producción
- ✅ Robots.txt incluido
- ✅ Metadata SEO configurada

### Archivos Importantes para Vercel

- `vercel.json`: Configuración específica de Vercel
- `next.config.js`: Configuración de Next.js optimizada
- `.env.example`: Plantilla de variables de entorno
- `package.json`: Versiones actualizadas y engines especificados

### Comandos de Verificación Local

```bash
# Verificar que el build funciona
npm run build

# Verificar tipos de TypeScript
npm run type-check

# Ejecutar en modo producción local
npm run start
```

## Sistema de Debug

### Panel de Debug
- Accesible mediante el botón "🐛 Debug" en la esquina superior derecha
- Muestra logs en tiempo real con timestamps
- Diferentes niveles de log: error, warning, info, success, debug
- Función de limpieza de logs
- Información detallada sobre cada evento

### Tipos de Monitoreo

#### Carga del Iframe
- Tiempo de inicio de carga
- Tiempo total de carga
- Errores de carga
- Timeouts

#### Red y Conectividad
- Verificación de conectividad inicial
- Monitoreo de peticiones HTTP
- Estados de respuesta del servidor
- Detección de problemas de CORS

#### Navegador y Entorno
- Estado de cookies
- Capacidades del navegador (localStorage, sessionStorage)
- Información del user agent
- Estado de conexión
- Dimensiones del viewport

#### Contenido del Iframe
- Verificación de contenido cargado
- Dimensiones del iframe
- Accesibilidad del contenido (cuando es posible)

## Manejo de Errores

### Reintentos Automáticos
- Configurables mediante `NEXT_PUBLIC_RETRY_ATTEMPTS`
- Delay configurable entre reintentos
- Información visual del progreso de reintentos

### Tipos de Error Detectados
- Timeouts de carga
- Errores de red
- Problemas de CORS
- Contenido vacío o inválido
- Cookies deshabilitadas
- Problemas de conectividad

### Indicadores Visuales
- Spinner de carga con información de progreso
- Mensajes de error detallados
- Botones de reintento con contador
- Información de debug contextual

## Seguridad

### Content Security Policy
- Configurada para permitir el dominio del formulario
- Restricciones de frame-src apropiadas
- Permisos de script controlados

### Sandbox del Iframe
- Permisos mínimos necesarios configurables
- Aislamiento de seguridad apropiado
- Prevención de ataques de clickjacking

## Estructura del Proyecto

```
├── app/
│   ├── components/
│   │   ├── DebugPanel.tsx      # Panel de debug en tiempo real
│   │   └── IframeLoader.tsx    # Componente de carga del iframe
│   ├── utils/
│   │   └── debug.ts            # Sistema de logging y debug
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página principal
├── .env.local                  # Variables de entorno
├── next.config.js              # Configuración de Next.js
└── package.json                # Dependencias del proyecto
```

## Comandos Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Construcción para producción
npm run start    # Servidor de producción
npm run lint     # Linting del código
```

## Troubleshooting

### El formulario no carga
1. Verificar las variables de entorno en `.env.local`
2. Revisar el panel de debug para errores específicos
3. Verificar conectividad de red
4. Comprobar que las cookies están habilitadas

### Problemas de CORS
- Normal para iframes de dominios externos
- El debug mostrará advertencias esperadas
- No afecta la funcionalidad del formulario

### Timeouts frecuentes
- Ajustar `NEXT_PUBLIC_LOAD_TIMEOUT`
- Verificar la estabilidad de la conexión
- Revisar logs de red en el debug

### Debug no aparece
- Verificar que `NEXT_PUBLIC_DEBUG_MODE=true`
- Comprobar que no hay errores de JavaScript en la consola
- Refrescar la página