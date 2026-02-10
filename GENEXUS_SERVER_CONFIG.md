# Configuración del Servidor GeneXus para Iframe Cross-Site

## Problema Actual
El formulario GeneXus está devolviendo error 401 (Unauthorized) cuando se carga en un iframe desde un dominio diferente. Esto sucede porque:

1. Las cookies de sesión no se están enviando correctamente en el contexto cross-site
2. El servidor GeneXus no está configurado para aceptar peticiones desde iframes externos
3. Las políticas de seguridad del navegador bloquean las cookies de terceros

## Configuraciones Necesarias en GeneXus

### 1. Configuración de Headers HTTP

En el servidor GeneXus (Tomcat), agregar estos headers en `web.xml` o mediante filtros:

```xml
<!-- Permitir embedding en iframes desde dominios específicos -->
<filter>
    <filter-name>HeadersFilter</filter-name>
    <filter-class>org.apache.catalina.filters.HttpHeaderSecurityFilter</filter-class>
    <init-param>
        <param-name>antiClickJackingOption</param-name>
        <param-value>SAMEORIGIN</param-value>
    </init-param>
    <!-- O para permitir desde dominios específicos: -->
    <init-param>
        <param-name>antiClickJackingUri</param-name>
        <param-value>https://tu-dominio-nextjs.vercel.app</param-value>
    </init-param>
</filter>

<filter-mapping>
    <filter-name>HeadersFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

### 2. Configuración de Cookies SameSite

Modificar la configuración de cookies en GeneXus:

```xml
<!-- En web.xml -->
<session-config>
    <cookie-config>
        <secure>true</secure>
        <http-only>false</http-only>
        <same-site>None</same-site>
    </cookie-config>
</session-config>
```

### 3. Headers CORS Específicos

Agregar headers CORS que permitan cookies cross-site:

```java
// En un filtro personalizado o en la configuración del servidor
response.setHeader("Access-Control-Allow-Origin", "https://tu-dominio-nextjs.vercel.app");
response.setHeader("Access-Control-Allow-Credentials", "true");
response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
```

### 4. Configuración en GeneXus Generator

En las propiedades del generador Java:

1. **Session Management**:
   - `Session Timeout`: Configurar un timeout apropiado
   - `Session Cookies`: Habilitar
   - `Secure Cookies`: True (para HTTPS)

2. **Security Settings**:
   - `Frame Options`: Configurar para permitir embedding
   - `Content Security Policy`: Ajustar para permitir el dominio padre

### 5. Código GeneXus para Manejo de Sesiones

En el objeto principal del formulario, agregar:

```genexus
// Al inicio del formulario
If &HttpRequest.ServerName <> "ticketsplusform.mendoza.gov.ar"
   // Verificar si viene de un iframe autorizado
   &Referer = &HttpRequest.GetHeader("Referer")
   If &Referer.IndexOf("tu-dominio-nextjs.vercel.app") > 0
      // Permitir acceso desde iframe
      &HttpResponse.AddHeader("X-Frame-Options", "ALLOW-FROM https://tu-dominio-nextjs.vercel.app")
   EndIf
EndIf

// Configurar cookies para cross-site
&HttpResponse.AddHeader("Set-Cookie", "JSESSIONID=" + &Session.Id + "; SameSite=None; Secure; Path=/")
```

### 6. Configuración de Tomcat (server.xml)

```xml
<Context>
    <!-- Configurar cookies para cross-site -->
    <CookieProcessor sameSiteCookies="none" />
</Context>
```

## Configuración Alternativa: Proxy Reverso

Si no es posible modificar el servidor GeneXus, se puede implementar un proxy reverso:

### En Next.js (next.config.js):

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/genexus/:path*',
        destination: 'https://ticketsplusform.mendoza.gov.ar/ticketsplusform/:path*'
      }
    ]
  }
}
```

### Luego usar la URL del proxy en el iframe:

```javascript
const formUrl = `/genexus/com.ticketsplus.responderformularioif?${params}`;
```

## Verificación

Para verificar que las configuraciones funcionan:

1. Abrir DevTools → Network
2. Verificar que las peticiones incluyan cookies
3. Verificar headers de respuesta:
   - `Set-Cookie` debe incluir `SameSite=None; Secure`
   - `X-Frame-Options` debe permitir el embedding
   - Headers CORS deben estar presentes

## Contacto con Administrador GeneXus

Enviar esta documentación al administrador del servidor GeneXus con:

1. La URL exacta del iframe padre: `https://tu-dominio-nextjs.vercel.app`
2. Los errores específicos (401 Unauthorized)
3. La necesidad de configurar cookies cross-site
4. Los headers necesarios listados arriba

## Solución Temporal

Mientras se implementan los cambios del servidor, se puede:

1. Usar un botón que abra el formulario en nueva ventana
2. Implementar un proxy reverso en Next.js
3. Usar postMessage para comunicación entre ventanas