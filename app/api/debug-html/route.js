import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    let targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Decodificar la URL si está encoded
    targetUrl = decodeURIComponent(targetUrl);

    console.log(`Debug HTML: Fetching ${targetUrl}`);

    // Hacer la petición al servidor GeneXus
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Host': 'ticketsplusform.mendoza.gov.ar',
        'Origin': 'https://ticketsplusform.mendoza.gov.ar',
        'Referer': 'https://ticketsplusform.mendoza.gov.ar/ticketsplusform/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Error: ${response.status} ${response.statusText}`, { 
        status: response.status 
      });
    }

    const html = await response.text();
    
    // Extraer información relevante del HTML
    const cssMatches = html.match(/(href|src)\s*[:=]\s*["'][^"']*\.css[^"']*["']/g) || [];
    const jsMatches = html.match(/(href|src)\s*[:=]\s*["'][^"']*\.js[^"']*["']/g) || [];
    const imgMatches = html.match(/(href|src)\s*[:=]\s*["'][^"']*\.(png|jpg|jpeg|gif|svg|ico)[^"']*["']/g) || [];
    
    const analysis = {
      htmlLength: html.length,
      cssReferences: cssMatches,
      jsReferences: jsMatches,
      imageReferences: imgMatches,
      hasGeneXusContent: html.includes('gx-') || html.includes('GeneXus'),
      hasFormElements: html.includes('<form') || html.includes('<input'),
      title: html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'No title found',
      firstFewLines: html.split('\n').slice(0, 10).join('\n'),
    };

    return new NextResponse(JSON.stringify(analysis, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Debug HTML error:', error);
    return new NextResponse(`Debug Error: ${error.message}`, { status: 502 });
  }
}