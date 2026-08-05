import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dine Events - The Crimson Suite',
  description: 'Client portal and catering operations suite for professional event catering in Kenya',
  generator: 'v0.app',
  openGraph: {
    title: 'Dine Events — Catering Operations, Redefined',
    description: 'Plan events, review quotations, and pay invoices with M-Pesa.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/logo_dine.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo_dine.png',
        media: '(prefers-color-scheme: dark)',
      }
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#CC2622',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}