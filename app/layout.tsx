import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Formulario Tickets Plus - Gobierno de Mendoza',
  description: 'Aplicación para cargar formulario de Tickets Plus en iframe del Gobierno de Mendoza',
  keywords: 'tickets plus, mendoza, gobierno, formulario',
  authors: [{ name: 'Gobierno de Mendoza' }],
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}