import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  return handleProxy(request);
}

export async function POST(request) {
  return handleProxy(request);
}

export async function PUT(request) {
  return handleProxy(request);
}

export async function DELETE(request) {
  return handleProxy(request);
}

export async function HEAD(request) {
  return handleProxy(request);
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

async function handleProxy(request) {
  try {
    const url = new URL(request.url);
    let targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      // Si no hay parámetro url, intentar extraer de la URL
      const pathParts = url.pathname.split('/api/proxy/');
      if (pathParts.length > 1) {
        targetUrl = pathParts[1];
      } else {
        return new NextResponse('Missing URL parameter', { status: 400 });
      }
    }

    // Decodificar la URL si está encoded
    targetUrl = decodeURIComponent(targetUrl);

    // Construir la URL completa, evitando duplicaciones
    let fullTargetUrl;
    if (targetUrl.startsWith('http')) {
      fullTargetUrl = targetUrl;
    } else if (targetUrl.startsWith('/ticketsplusform/')) {
      fullTargetUrl = `https://ticketsplusform.mendoza.gov.ar${targetUrl}`;
    } else if (targetUrl.startsWith('/')) {
      fullTargetUrl = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform${targetUrl}`;
    } else {
      fullTargetUrl = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/${targetUrl}`;
    }

    // Agregar query parameters si existen
    if (url.search && !fullTargetUrl.includes('?')) {
      // Filtrar el parámetro 'url' de los query params
      const params = new URLSearchParams(url.search);
      params.delete('url');
      if (params.toString()) {
        fullTargetUrl += `?${params.toString()}`;
      }
    }

    console.log(`Proxying: ${request.method} ${fullTargetUrl}`);

    // Preparar headers
    const headers = new Headers();
    
    // Copiar headers importantes del request original
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'origin', 'referer', 'connection', 'upgrade-insecure-requests'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Establecer headers específicos para GeneXus
    headers.set('Host', 'ticketsplusform.mendoza.gov.ar');
    headers.set('Origin', 'https://ticketsplusform.mendoza.gov.ar');
    headers.set('Referer', 'https://ticketsplusform.mendoza.gov.ar/ticketsplusform/');
    headers.set('User-Agent', request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Hacer la petición al servidor GeneXus
    const response = await fetch(fullTargetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    });

    if (!response.ok) {
      console.error(`Proxy error: ${response.status} ${response.statusText} for ${fullTargetUrl}`);
      return new NextResponse(`Upstream error: ${response.status} ${response.statusText}`, { 
        status: response.status 
      });
    }

    // Leer el contenido de la respuesta
    let content = await response.arrayBuffer();
    let contentType = response.headers.get('content-type') || '';

    // Si es HTML o JavaScript, modificar las URLs para que apunten al proxy
    if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      let text = new TextDecoder().decode(content);
      
      console.log(`Rewriting ${contentType} URLs...`);
      
      // Reemplazar URLs absolutas del servidor GeneXus
      text = text.replace(
        /https:\/\/ticketsplusform\.mendoza\.gov\.ar\/ticketsplusform\//g,
        '/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/'
      );
      
      // Reemplazar URLs relativas en HTML/JS
      text = text.replace(
        /(href|src|action|url)\s*[:=]\s*["']\/ticketsplusform\/([^"']*?)["']/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );
      
      // Reemplazar URLs relativas que NO empiezan con /ticketsplusform/
      text = text.replace(
        /(href|src|action|url)\s*[:=]\s*["']\/(?!api|ticketsplusform)([^"']*?)["']/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );
      
      // Reemplazar URLs relativas sin barra inicial
      text = text.replace(
        /(href|src|action|url)\s*[:=]\s*["'](?!http|\/|#|data:)([^"']*?)["']/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );

      // Para JavaScript, también reemplazar URLs en strings
      if (contentType.includes('javascript')) {
        text = text.replace(
          /["']\/static\/([^"']*?)["']/g,
          '"/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/$1"'
        );
      }

      content = new TextEncoder().encode(text);
      console.log(`${contentType} URLs rewritten successfully`);
    } else {
      console.log(`Serving ${contentType} content directly`);
    }

    // Crear la respuesta
    const proxyResponse = new NextResponse(content, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copiar headers de respuesta
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        proxyResponse.headers.set(key, value);
      }
    }

    // Agregar headers CORS y de seguridad
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Permitir embedding en iframe
    proxyResponse.headers.delete('X-Frame-Options');
    proxyResponse.headers.delete('Content-Security-Policy');
    
    // Configurar cookies para cross-site
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      proxyResponse.headers.set('Set-Cookie', setCookie.replace(/SameSite=\w+/gi, 'SameSite=None; Secure'));
    }

    return proxyResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(`Proxy Error: ${error.message}`, { status: 502 });
  }
}