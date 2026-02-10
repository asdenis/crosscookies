# ✅ Checklist de Despliegue en Vercel

## Pre-requisitos Completados

### ✅ Configuración del Proyecto
- [x] Next.js 15.0.3 instalado y configurado
- [x] TypeScript configurado correctamente
- [x] Build exitoso sin errores
- [x] Linting sin errores
- [x] Todas las dependencias actualizadas

### ✅ Archivos de Configuración
- [x] `next.config.js` optimizado para producción
- [x] `vercel.json` configurado
- [x] `package.json` con engines especificados
- [x] `tsconfig.json` configurado
- [x] `.env.example` creado
- [x] `.gitignore` configurado
- [x] `robots.txt` incluido

### ✅ Seguridad y Headers
- [x] Content Security Policy configurada
- [x] Headers de seguridad implementados
- [x] X-Frame-Options configurado
- [x] Sandbox del iframe configurado
- [x] CORS manejado correctamente

### ✅ Funcionalidades
- [x] Sistema de debug exhaustivo
- [x] Manejo de errores robusto
- [x] Reintentos automáticos
- [x] Verificación de conectividad
- [x] Monitoreo de cookies
- [x] Interfaz responsive

### ✅ Optimizaciones
- [x] Componentes client-side marcados
- [x] No hay dependencias de Node.js en el cliente
- [x] Variables de entorno con prefijo NEXT_PUBLIC_
- [x] Metadata SEO configurada
- [x] Viewport configurado correctamente

## 🚀 Pasos para Desplegar en Vercel

### 1. Preparar el Repositorio
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Configurar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente Next.js

### 3. Configurar Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_FORM_BASE_URL=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/com.ticketsplus.responderformularioif
NEXT_PUBLIC_FORM_PARAMS=[TU_PARAMETRO_CODIFICADO]
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DEBUG_LEVEL=normal
NEXT_PUBLIC_IFRAME_WIDTH=100%
NEXT_PUBLIC_IFRAME_HEIGHT=800px
NEXT_PUBLIC_IFRAME_SANDBOX=allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation
NEXT_PUBLIC_LOAD_TIMEOUT=30000
NEXT_PUBLIC_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_DELAY=2000
```

### 4. Desplegar
- Vercel iniciará el build automáticamente
- El despliegue tomará aproximadamente 2-3 minutos
- Recibirás una URL de producción

### 5. Verificar Post-Despliegue
- [ ] La aplicación carga correctamente
- [ ] El iframe se muestra sin errores
- [ ] El sistema de debug funciona (si está habilitado)
- [ ] Los reintentos funcionan en caso de error
- [ ] Los headers de seguridad están activos

## 🔧 Comandos de Verificación Local

```bash
# Verificar build
npm run build

# Verificar tipos
npm run type-check

# Ejecutar en producción local
npm run start
```

## 📝 Notas Importantes

### Variables de Entorno
- **IMPORTANTE**: Cambiar `NEXT_PUBLIC_DEBUG_MODE=false` en producción
- Todas las variables deben tener prefijo `NEXT_PUBLIC_` para estar disponibles en el cliente
- El parámetro codificado debe copiarse exactamente desde `.env.local`

### Dominios y CORS
- El iframe carga contenido de `ticketsplusform.mendoza.gov.ar`
- Los headers CSP están configurados para permitir este dominio
- El modo `no-cors` está configurado para evitar problemas de conectividad

### Monitoreo
- Los logs de debug estarán disponibles en la consola del navegador
- En producción, considera usar `NEXT_PUBLIC_DEBUG_MODE=false`
- Los errores se manejan graciosamente con reintentos automáticos

## 🎯 Resultado Esperado

Una vez desplegado, tendrás:
- ✅ Aplicación funcionando en Vercel
- ✅ Formulario cargando en iframe
- ✅ Sistema de debug (si está habilitado)
- ✅ Manejo de errores robusto
- ✅ Headers de seguridad activos
- ✅ Interfaz responsive y profesional

## 🆘 Troubleshooting

### Si el build falla:
1. Verificar que todas las dependencias estén instaladas
2. Ejecutar `npm run build` localmente
3. Revisar los logs de Vercel

### Si el iframe no carga:
1. Verificar las variables de entorno en Vercel
2. Comprobar que el parámetro codificado sea correcto
3. Revisar los logs de debug en la consola

### Si hay errores de CORS:
- Es normal, el iframe debería cargar de todas formas
- Los headers CSP están configurados correctamente
- El modo `no-cors` maneja estos casos