import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Interceptar URLs que van directamente a /api/ pero no son /api/proxy
  if (url.pathname.startsWith('/api/') && 
      !url.pathname.startsWith('/api/proxy') && 
      !url.pathname.startsWith('/api/_next')) {
    
    // Extraer el recurso solicitado
    const resource = url.pathname.replace('/api/', '');
    
    // Redirigir al proxy con la URL correcta
    const proxyUrl = `/api/proxy?url=https://ticketsplusform.mendoza.gov.ar/ticketsplusform/static/${resource}`;
    
    console.log(`Middleware redirect: ${url.pathname} -> ${proxyUrl}`);
    
    return NextResponse.redirect(new URL(proxyUrl + url.search, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
};