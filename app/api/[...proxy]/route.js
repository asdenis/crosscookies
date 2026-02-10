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
    
    // Construir la URL de destino
    let targetUrl;
    if (proxyPath.startsWith('static/') || proxyPath.startsWith('ticketsplusform/')) {
      targetUrl = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/${proxyPath}`;
    } else {
      targetUrl = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${proxyPath}`;
    }

    // Agregar query parameters
    if (url.search) {
      targetUrl += url.search;
    }

    console.log(`Dynamic proxy: ${request.method} ${targetUrl}`);

    // Preparar headers
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

    // Hacer la petición
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    });

    if (!response.ok) {
      console.error(`Dynamic proxy error: ${response.status} for ${targetUrl}`);
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

    // Headers CORS
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return proxyResponse;

  } catch (error) {
    console.error('Dynamic proxy error:', error);
    return new NextResponse(`Proxy Error: ${error.message}`, { status: 502 });
  }
}