// app/layout.tsx
import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from "@/components/ui/toaster"
import Navigation from '@/components/Navigation'; 
import { ClientProviders } from '@/components/providers/ClientProviders';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nothing2C',
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
    'apple-mobile-web-app-title': 'Nothing²ᶜ',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} text-foreground`}>
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navigation />
            <ClientProviders>
              <main className="pt-[var(--navbar-height)]">
                {children}
              </main>
            </ClientProviders>
            <Toaster />
          </AuthProvider>
        </NextThemesProvider>
        <Analytics/>
      </body>
    </html>
  )
}
