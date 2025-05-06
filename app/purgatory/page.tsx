// app/purgatory/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactElement } from 'react'
import Link from 'next/link'
import BGIMG from '../components/BGIMG'
import { getUserFromToken } from '../api/lib/auth'

/** Minimal shape of our user object */
interface User {
  id: string
  name?: string
  isConfirmed: boolean
}

export default async function PurgatoryPage(): Promise<ReactElement> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/login')

  let user: User | null = null
  try {
    user = await getUserFromToken(token)
  } catch {
    redirect('/login')
  }
  if (!user) redirect('/login')
  if (user.isConfirmed) redirect('/')

  const name = user.name ?? 'User'

  return (
    <main className="relative flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-4xl font-bold mb-6 text-red-600">
          Welcome, {name}!
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Thank you for registering. Your account is currently pending confirmation by an administrator.
        </p>
        <p className="text-lg text-gray-700 mb-8">
          Please wait patiently. If you believe there is an issue, feel free to reach out via the{' '}
          <Link href="/contact" className="text-red-600 underline hover:text-red-800">
            Contact
          </Link>{' '}
          page.
        </p>
      </div>
    </main>
  )
}
