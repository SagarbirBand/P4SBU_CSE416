// app/page.tsx
import type { ReactElement } from 'react'
import Link                  from 'next/link'
import { cookies }           from 'next/headers'
import { redirect }          from 'next/navigation'
import BGIMG                 from './components/BGIMG'
import { getUserFromToken }  from './api/lib/auth'

interface UserPayload {
  id: string
  name: string
  isConfirmed: boolean
}

export default async function Home(): Promise<ReactElement> {
  // 1) Because cookies() returns a Promise in TS, we await it
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value

  // 2) No token? show guest home
  if (!token) {
    return renderHome(false)
  }

  // 3) Validate token & fetch user
  let user: UserPayload | null = null
  try {
    user = await getUserFromToken(token)
  } catch {
    // invalid or expired - treat as guest
    return renderHome(false)
  }

  // 4) Logged in but not approved - redirect immediately
  if (user && !user.isConfirmed) {
    redirect('/purgatory')
  }

  // 5) Otherwise show home for confirmed users
  return renderHome(true)
}

function renderHome(isLoggedIn: boolean): ReactElement {
  const destinationUrl = isLoggedIn ? '/reserve' : '/login'

  return (
    <main className="relative flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />
      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl font-bold mb-4 text-red-500">
          Welcome to P4SBU Parking System
        </h1>
        <p className="mb-6 text-black">
          Easily reserve your parking spot at Stony Brook University!
        </p>
        {
          isLoggedIn ? 
            <p>To view and edit your information, review your current orders and order history as well as your current and past fines, visit the profile page</p>
            : null
        }
        <div className="flex justify-center space-x-4">
          <Link
            href={destinationUrl}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
          >
            {isLoggedIn ? 'Reserve Now' : 'Login to Reserve'}
          </Link>
        </div>
      </div>
    </main>
  )
}
