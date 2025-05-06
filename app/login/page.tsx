'use client'

import type { FC, ChangeEvent, FormEvent, ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BGIMG from '../components/BGIMG'
import FormInput from '../components/FormInput'

/** --- Types --- */
interface Credentials {
  email: string
  password: string
  stayLoggedIn: boolean
}

interface UserResponse {
  id: string
  name: string
  email: string
  permitType: string
  isAdmin: boolean
  licensePlate: string
  address: string
  isConfirmed: boolean
}

interface LoginSuccessResponse {
  message: string
  user: UserResponse
}

interface LoginErrorResponse {
  error: string
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse

interface AuthStatusResponse {
  loggedIn: boolean
  user?: UserResponse
}

/** --- Component --- */
const LoginPage: FC = (): ReactElement | null => {
  const router = useRouter()

  // Form state
  const [credentials, setCredentials] = useState<Credentials>({
    email: '',
    password: '',
    stayLoggedIn: false
  })
  const [error, setError] = useState<string>('')
  const [checking, setChecking] = useState<boolean>(true)

  // Redirect immediately if already logged in
  useEffect(() => {
    const checkLogin = async (): Promise<void> => {
      try {
        const res: Response = await fetch('/api/login?includeUser=false', {
          method: 'GET',
          cache: 'no-store'
        })
        const data: AuthStatusResponse = await res.json()
        if (data.loggedIn) {
          void router.replace('/')
        } else {
          setChecking(false)
        }
      } catch {
        // On network error, still show form
        setChecking(false)
      }
    }
    void checkLogin()
  }, [router])

  // Avoid flashing the form while checking auth
  if (checking) return null

  // Update credentials from inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Submit credentials, handle all server-side and network errors
  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')

    try {
      const res: Response = await fetch('/api/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      const data = (await res.json()) as LoginResponse

      if (!res.ok) {
        // Surface server error message if provided
        setError('error' in data ? data.error : 'Login failed—please try again.')
        return
      }

      // On success, redirect based on approval status
      const { user } = data as LoginSuccessResponse
      if (user.isConfirmed) {
        void router.replace('/')
      } else {
        void router.replace('/purgatory')
      }
    } catch {
      // Network or unexpected error
      setError('Network error—please check your connection.')
    }
  }

  return (
    <main className="relative flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />

      <form
        onSubmit={handleLogin}
        className="relative z-10 text-black bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <FormInput
          label="Email:"
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Password:"
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />

        <label className="block mb-4">
          <input
            type="checkbox"
            name="stayLoggedIn"
            checked={credentials.stayLoggedIn}
            onChange={handleChange}
            className="mr-2"
          />
          Stay logged in
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700">
            Register
          </Link>
        </p>
      </form>
    </main>
  )
}

export default LoginPage
