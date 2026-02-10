/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Quita o relaja X-Frame-Options si quieres permitir embedding desde otros sitios
          // { key: 'X-Frame-Options', value: 'SAMEORIGIN' },  // coméntalo o cámbialo a ALLOW-FROM si necesitas

          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "frame-src 'self' https://ticketsplusform.mendoza.gov.ar https://*.mendoza.gov.ar;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ticketsplusform.mendoza.gov.ar;",
              "style-src 'self' 'unsafe-inline' https://ticketsplusform.mendoza.gov.ar;",
              "img-src 'self' data: blob: https://ticketsplusform.mendoza.gov.ar;",
              "connect-src 'self' https://ticketsplusform.mendoza.gov.ar;",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self' https://*.mendoza.gov.ar;",  // permite que te embeban
            ].join(' '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Opcional: Permissions-Policy para permitir storage access
          {
            key: 'Permissions-Policy',
            value: 'storage-access=(self "https://ticketsplusform.mendoza.gov.ar")',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;