import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { path } = params;
    const cssPath = Array.isArray(path) ? path.join('/') : path;
    
    // Construir la URL del archivo CSS
    const targetUrl = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${cssPath}`;
    
    console.log(`CSS proxy: ${targetUrl}`);

    // Hacer la petición
    const response = await fetch(targetUrl, {
      headers: {
        'Host': 'ticketsplusform.mendoza.gov.ar',
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept': 'text/css,*/*;q=0.1',
      },
    });

    if (!response.ok) {
      console.error(`CSS proxy error: ${response.status} for ${targetUrl}`);
      return new NextResponse(`CSS not found: ${cssPath}`, { status: 404 });
    }

    const content = await response.text();
    
    // Reescribir URLs en el CSS
    let processedContent = content;
    
    // Reemplazar URLs relativas en CSS
    processedContent = processedContent.replace(
      /url\(["']?(?!http|\/|#|data:)([^"')]*?)["']?\)/g,
      'url("/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/$1")'
    );
    
    processedContent = processedContent.replace(
      /url\(["']?\/([^"')]*?)["']?\)/g,
      'url("/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/$1")'
    );

    // Crear respuesta con MIME type correcto
    const cssResponse = new NextResponse(processedContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'public, max-age=3600',
      },
    });

    console.log(`CSS served successfully: ${cssPath}`);
    return cssResponse;

  } catch (error) {
    console.error('CSS proxy error:', error);
    return new NextResponse(`CSS Error: ${error.message}`, { status: 502 });
  }
}