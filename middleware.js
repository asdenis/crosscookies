import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Interceptar URLs que van directamente a /ticketsplusform/
  if (url.pathname.startsWith('/ticketsplusform/')) {
    const targetUrl = `https://ticketsplusform.mendoza.gov.ar${url.pathname}`;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    
    console.log(`Middleware redirect ticketsplusform: ${url.pathname} -> ${proxyUrl}`);
    
    return NextResponse.redirect(new URL(proxyUrl + url.search, request.url));
  }
  
  // Interceptar URLs que van directamente a /api/ pero no son /api/proxy
  if (url.pathname.startsWith('/api/') && 
      !url.pathname.startsWith('/api/proxy') && 
      !url.pathname.startsWith('/api/_next')) {
    
    // Extraer el recurso solicitado
    const resource = url.pathname.replace('/api/', '');
    
    // Determinar la ruta correcta basada en el tipo de recurso
    let targetPath;
    if (resource.endsWith('.css') || resource.endsWith('.js')) {
      targetPath = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${resource}`;
    } else if (resource.endsWith('.woff') || resource.endsWith('.ttf') || resource.endsWith('.otf')) {
      // Para fuentes, intentar primero en Resources/Spanish
      targetPath = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/Resources/Spanish/${resource}`;
    } else if (resource.endsWith('.png') || resource.endsWith('.gif') || resource.endsWith('.jpg')) {
      targetPath = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/Resources/${resource}`;
    } else {
      targetPath = `https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${resource}`;
    }
    
    // Redirigir al proxy con la URL correcta
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetPath)}`;
    
    console.log(`Middleware redirect: ${url.pathname} -> ${proxyUrl}`);
    
    return NextResponse.redirect(new URL(proxyUrl + url.search, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/ticketsplusform/:path*'
  ]
};