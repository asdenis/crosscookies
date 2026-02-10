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
            value: "frame-src 'self' https://ticketsplusform.mendoza.gov.ar https://*.mendoza.gov.ar; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'; base-uri 'self';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'storage-access=*',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/genexus/:path*',
        destination: 'https://ticketsplusform.mendoza.gov.ar/ticketsplusform/:path*',
      },
    ];
  },
};

module.exports = nextConfig;