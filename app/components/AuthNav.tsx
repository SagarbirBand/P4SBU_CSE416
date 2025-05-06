// app/components/AuthNav.tsx
'use client'

import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface User {
  isAdmin: boolean
  isConfirmed: boolean
}

export default function AuthNav(): ReactElement {
  const [user, setUser]       = useState<User|null>(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()
  const pathname              = usePathname()

  useEffect(() => {
    let active = true
    setLoading(true)

    ;(async () => {
      try {
        const res = await fetch('/api/login?includeUser=true', { cache: 'no-store' })
        const { loggedIn, user } = await res.json()
        console.log(user, user.isAuth, user.isConfirmed);
        if (active) setUser(loggedIn ? user : null)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [pathname])

  if (loading) {
    return <div className="w-24 h-6 bg-gray-200 animate-pulse rounded" />
  }

  if (!user) {
    return (
      <div className="space-x-4">
        <Link href="/contact" className="nav-btn-1">Contact</Link>
        <Link href="/login"   className="nav-btn-2">Login</Link>
        <Link href="/register"className="nav-btn-2">Register</Link>
      </div>
    )
  }

  if (!user.isConfirmed) {
    return (
      <div className="space-x-4">
        <span className="text-yellow-600">Pending…</span>
        <button
          onClick={async () => {
            await fetch('/api/logout')
            router.replace('/login')
          }}
          className="nav-btn-2"
        >
          Log Out
        </button>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="space-x-4">
        <Link href="/reserve" className="nav-btn-1">Reserve</Link>
        <Link href="/profile" className="nav-btn-1">Profile</Link>
        <button
          onClick={async () => {
            await fetch('/api/logout')
            router.replace('/login')
          }}
          className="nav-btn-2"
        >
          Log Out
        </button>
      </div>
    )
  }

  return (
    <div className="space-x-4">
      <Link href="/ParkingMgmt" className="nav-btn-1">Parking Mgmt.</Link>
      <Link href="/userAuth"    className="nav-btn-1">User Auth</Link>
      <Link href="/giveFines"   className="nav-btn-1">Fines</Link>
      <Link href="/reports"     className="nav-btn-1">Reports</Link>
      <button
        onClick={async () => {
          await fetch('/api/logout')
          router.replace('/login')
        }}
        className="nav-btn-2"
      >
        Log Out
      </button>
    </div>
  )
}
