import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dine Events - Catering Management System',
  description: 'Streamline your event management and catering operations',
  generator: 'v0.app',
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
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}