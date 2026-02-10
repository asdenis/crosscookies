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

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

async function handleProxy(request) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

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

    console.log(`Proxying: ${request.method} ${fullTargetUrl}`);
    console.log(`Original URL param: ${targetUrl}`);
    console.log(`Constructed URL: ${fullTargetUrl}`);

    // Preparar headers
    const headers = new Headers();
    
    // Copiar headers importantes del request original
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Establecer headers específicos para GeneXus
    headers.set('Host', 'ticketsplusform.mendoza.gov.ar');
    headers.set('Origin', 'https://ticketsplusform.mendoza.gov.ar');
    headers.set('Referer', 'https://ticketsplusform.mendoza.gov.ar/');
    headers.set('User-Agent', request.headers.get('user-agent') || 'Mozilla/5.0');

    // Hacer la petición al servidor GeneXus
    const response = await fetch(fullTargetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.arrayBuffer() : undefined,
    });

    // Leer el contenido de la respuesta
    let content = await response.arrayBuffer();
    let contentType = response.headers.get('content-type') || '';

    // Si es HTML, modificar las URLs para que apunten al proxy
    if (contentType.includes('text/html')) {
      let html = new TextDecoder().decode(content);
      
      console.log('Rewriting HTML URLs...');
      
      // Reemplazar URLs absolutas del servidor GeneXus
      html = html.replace(
        /https:\/\/ticketsplusform\.mendoza\.gov\.ar\/ticketsplusform\//g,
        '/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/'
      );
      
      // Reemplazar URLs relativas que empiezan con /ticketsplusform/
      html = html.replace(
        /(href|src|action)="\/ticketsplusform\/([^"]*?)"/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );
      
      // Reemplazar URLs relativas que NO empiezan con /ticketsplusform/
      html = html.replace(
        /(href|src|action)="\/(?!api|ticketsplusform)([^"]*?)"/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );
      
      // Reemplazar URLs relativas sin barra inicial (relativas al directorio actual)
      html = html.replace(
        /(href|src|action)="(?!http|\/|#)([^"]*?)"/g,
        '$1="/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$2"'
      );

      content = new TextEncoder().encode(html);
      console.log('HTML URLs rewritten successfully');
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
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        proxyResponse.headers.set(key, value);
      }
    }

    // Agregar headers CORS y de seguridad
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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