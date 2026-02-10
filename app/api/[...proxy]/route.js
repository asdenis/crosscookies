import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  return handleDynamicProxy(request, params);
}

export async function POST(request, { params }) {
  return handleDynamicProxy(request, params);
}

export async function PUT(request, { params }) {
  return handleDynamicProxy(request, params);
}

export async function DELETE(request, { params }) {
  return handleDynamicProxy(request, params);
}

export async function HEAD(request, { params }) {
  return handleDynamicProxy(request, params);
}

async function handleDynamicProxy(request, { proxy }) {
  try {
    const url = new URL(request.url);
    
    // Construir la ruta del proxy
    const proxyPath = Array.isArray(proxy) ? proxy.join('/') : proxy;
    
    console.log(`Dynamic proxy request for: ${proxyPath}`);
    
    // Lista de posibles rutas a intentar
    const possibleUrls = [
      `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${proxyPath}`,
      `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/${proxyPath}`,
      `https://ticketsplusform.mendoza.gov.ar/${proxyPath}`,
    ];

    let response;
    let targetUrl;
    
    // Intentar cada URL hasta encontrar una que funcione
    for (const tryUrl of possibleUrls) {
      targetUrl = tryUrl + (url.search || '');
      console.log(`Trying: ${targetUrl}`);
      
      try {
        const headers = new Headers();
        
        for (const [key, value] of request.headers.entries()) {
          if (!['host', 'origin', 'referer', 'connection'].includes(key.toLowerCase())) {
            headers.set(key, value);
          }
        }

        headers.set('Host', 'ticketsplusform.mendoza.gov.ar');
        headers.set('Origin', 'https://ticketsplusform.mendoza.gov.ar');
        headers.set('Referer', 'https://ticketsplusform.mendoza.gov.ar/ticketsplusform/');
        headers.set('User-Agent', request.headers.get('user-agent') || 'Mozilla/5.0');

        response = await fetch(targetUrl, {
          method: request.method,
          headers: headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
        });

        if (response.ok) {
          console.log(`Success with: ${targetUrl}`);
          break;
        }
      } catch (error) {
        console.log(`Failed with ${targetUrl}: ${error.message}`);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error(`All attempts failed for: ${proxyPath}`);
      return new NextResponse(`Resource not found: ${proxyPath}`, { status: 404 });
    }

    // Crear la respuesta
    const content = await response.arrayBuffer();
    const proxyResponse = new NextResponse(content, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copiar headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        proxyResponse.headers.set(key, value);
      }
    }

    // Corregir MIME types
    const pathLower = proxyPath.toLowerCase();
    if (pathLower.endsWith('.css')) {
      proxyResponse.headers.set('Content-Type', 'text/css');
    } else if (pathLower.endsWith('.js')) {
      proxyResponse.headers.set('Content-Type', 'application/javascript');
    } else if (pathLower.endsWith('.woff') || pathLower.endsWith('.woff2')) {
      proxyResponse.headers.set('Content-Type', 'font/woff');
    } else if (pathLower.endsWith('.ttf')) {
      proxyResponse.headers.set('Content-Type', 'font/ttf');
    } else if (pathLower.endsWith('.png')) {
      proxyResponse.headers.set('Content-Type', 'image/png');
    } else if (pathLower.endsWith('.jpg') || pathLower.endsWith('.jpeg')) {
      proxyResponse.headers.set('Content-Type', 'image/jpeg');
    } else if (pathLower.endsWith('.gif')) {
      proxyResponse.headers.set('Content-Type', 'image/gif');
    } else if (pathLower.endsWith('.svg')) {
      proxyResponse.headers.set('Content-Type', 'image/svg+xml');
    }

    // Headers CORS
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return proxyResponse;

  } catch (error) {
    console.error('Dynamic proxy error:', error);
    return new NextResponse(`Proxy Error: ${error.message}`, { status: 502 });
  }
}