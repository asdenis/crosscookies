/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "frame-src 'self' https://ticketsplusform.mendoza.gov.ar https://*.mendoza.gov.ar;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ticketsplusform.mendoza.gov.ar;",
              "style-src 'self' 'unsafe-inline' https://ticketsplusform.mendoza.gov.ar;",
              "img-src 'self' data: blob: https://ticketsplusform.mendoza.gov.ar;",
              "connect-src 'self' https://ticketsplusform.mendoza.gov.ar https://*.mendoza.gov.ar;",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self' https://*.mendoza.gov.ar;",  // permite embedding
            ].join(' '),
          },
          { key: 'Permissions-Policy', value: 'storage-access=(self "https://ticketsplusform.mendoza.gov.ar")' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;