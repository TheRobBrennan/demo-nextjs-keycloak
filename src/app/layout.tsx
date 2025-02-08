import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './Providers'
import SessionGuard from '@/components/SessionGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '[DEMO] TDR Keyloak',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SessionGuard>
            {children}
          </SessionGuard>
        </Providers>
      </body>
    </html>
  )
}
