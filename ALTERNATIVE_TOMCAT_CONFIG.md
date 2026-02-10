# 🔧 Configuraciones Alternativas para Tomcat + GeneXus

## 🚨 **Problema Persistente Identificado**

A pesar de la implementación de Storage Access API, los problemas persisten:
- **Chrome/Edge:** Botón "Iniciar" sigue dando 401
- **Firefox:** Tilde ✓ de adjuntos no se marca

Esto indica que necesitamos configuraciones más agresivas en el lado del servidor.

## 🎯 **Configuraciones Alternativas a Probar**

### **Opción 1: SameSite=None con Secure (Más Agresiva)**

```properties
# client.cfg - GeneXus
SAMESITE_COOKIE=None
HTTP_PROTOCOL=Secure
```

```xml
<!-- server.xml - Tomcat -->
<Context>
  <CookieProcessor sameSiteCookies="none" />
</Context>
```

**Pros:** Permite cookies cross-site explícitamente
**Contras:** Requiere HTTPS obligatorio

### **Opción 2: Partitioned Cookies (Chrome/Edge)**

```xml
<!-- server.xml - Tomcat -->
<Context>
  <CookieProcessor 
    sameSiteCookies="none" 
    usePartitioned="true" 
    partitioned="true" />
</Context>
```

```properties
# client.cfg - GeneXus
SAMESITE_COOKIE=None
HTTP_PROTOCOL=Secure
```

**Pros:** Compatible con CHIPS de Chrome
**Contras:** Experimental, puede romper otros navegadores

### **Opción 3: Headers Personalizados**

```xml
<!-- web.xml - Agregar filtro -->
<filter>
  <filter-name>CookieFilter</filter-name>
  <filter-class>com.example.CookieFilter</filter-class>
</filter>
<filter-mapping>
  <filter-name>CookieFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

```java
// CookieFilter.java
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    HttpServletResponse httpResponse = (HttpServletResponse) response;
    
    // Headers para Storage Access API
    httpResponse.setHeader("Permissions-Policy", "storage-access=*");
    httpResponse.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    
    chain.doFilter(request, response);
}
```

### **Opción 4: Configuración Dual (Recomendada)**

```properties
# client.cfg - GeneXus
SAMESITE_COOKIE=None
HTTP_PROTOCOL=Secure
COOKIE_SECURE=true
```

```xml
<!-- server.xml - Tomcat -->
<Connector port="8443" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443"
           secure="true"
           scheme="https" />

<Context>
  <CookieProcessor 
    sameSiteCookies="none"
    secure="true" />
</Context>
```

## 🔍 **Diagnóstico Avanzado**

### **Test 1: Verificar Headers de Cookies**

Abrir DevTools → Network → Buscar petición inicial:

```
Set-Cookie: GX_SESSION_ID=...; SameSite=None; Secure
Set-Cookie: GX_CLIENT_ID=...; SameSite=None; Secure
```

### **Test 2: Verificar Petición POST**

En la petición a `responderformularioif`:

```
Cookie: GX_SESSION_ID=...; GX_CLIENT_ID=...
```

Si no aparecen las cookies → problema de configuración servidor
Si aparecen pero da 401 → problema de sesión GeneXus

### **Test 3: Storage Access API Status**

En consola del navegador:

```javascript
// Verificar estado
document.hasStorageAccess().then(console.log);

// Verificar cookies disponibles
console.log(document.cookie);
```

## 🚀 **Configuración Recomendada Final**

Basándome en el análisis, la configuración más probable de funcionar:

### **Tomcat (server.xml)**
```xml
<Context>
  <CookieProcessor 
    sameSiteCookies="none"
    secure="true" />
</Context>
```

### **GeneXus (client.cfg)**
```properties
SAMESITE_COOKIE=None
HTTP_PROTOCOL=Secure
COOKIE_SECURE=true
```

### **Next.js (Adicional)**
```typescript
// Agregar headers específicos
headers: [
  {
    key: 'Permissions-Policy',
    value: 'storage-access=*'
  },
  {
    key: 'Cross-Origin-Embedder-Policy', 
    value: 'credentialless'
  }
]
```

## 🔄 **Proceso de Testing**

1. **Aplicar configuración Tomcat**
2. **Reiniciar Tomcat**
3. **Verificar HTTPS funcionando**
4. **Probar con Storage Access API habilitado**
5. **Verificar headers de cookies en DevTools**
6. **Probar flujo completo**

## ⚠️ **Consideraciones Importantes**

- **HTTPS Obligatorio:** SameSite=None requiere Secure=true
- **Certificado SSL:** Debe ser válido para el dominio
- **Compatibilidad:** Puede afectar otros navegadores
- **Seguridad:** SameSite=None reduce protección CSRF

## 🎯 **Si Nada Funciona**

### **Última Opción: Proxy Reverso**

Configurar nginx/Apache como proxy para hacer que ambos dominios parezcan same-site:

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name mxm.mendoza.gov.ar;
    
    location /ticketsplus/ {
        proxy_pass https://ticketsplusform.mendoza.gov.ar/;
        proxy_set_header Host ticketsplusform.mendoza.gov.ar;
        proxy_cookie_domain ticketsplusform.mendoza.gov.ar mxm.mendoza.gov.ar;
    }
}
```

Esto haría que la URL sea:
`https://mxm.mendoza.gov.ar/ticketsplus/servlet/...`

**Ventaja:** Same-site, no necesita Storage Access API
**Desventaja:** Requiere configuración de infraestructura