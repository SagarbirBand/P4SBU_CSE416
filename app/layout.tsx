// app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'
import Link               from 'next/link'
import AuthNav            from './components/AuthNav'

export const metadata = { title: 'P4SBU', description: 'Parking Website' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <AuthNav />
        </nav>
        {children}
      </body>
    </html>
  )
}
