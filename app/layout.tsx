//app/layout.tsx
import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { Analytics } from "@vercel/analytics/react"
import { ScreenSizeProvider } from '@/context/ScreenSizeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kino & Chill',
  description: 'Track and share movies with friends',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/popcorn.png',
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black',
    'apple-mobile-web-app-title': 'Kino & Chill',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-foreground `}>
        <ScreenSizeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ScreenSizeProvider>
        <Analytics/>
      </body>
    </html>
  )
}