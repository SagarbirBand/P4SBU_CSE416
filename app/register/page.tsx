// app/register/page.tsx
'use client'

import { FC, ReactElement, ChangeEvent, FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BGIMG from '../components/BGIMG'
import FormInput from '../components/FormInput'
import { z } from 'zod'

/** --- Client‐side validation schema --- */
const RegisterSchema = z.object({
  fullName:     z.string().min(1,      'Name is required'),
  email:        z.string().email(      'Invalid email address'),
  password:     z.string().min(8,      'Password must be at least 8 characters'),
  permitType:   z.string().min(1,      'Please select a permit type'),
  licensePlate: z.string().min(1,      'License plate is required'),
  address:      z.string().min(1,      'Address is required'),
})

type RegisterRequest = z.infer<typeof RegisterSchema>
type RegisterError   = { error: string }
type RegisterSuccess = { message: string }

/** --- Component --- */
const RegisterPage: FC = (): ReactElement | null => {
  const router = useRouter()

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName:     '',
    email:        '',
    password:     '',
    permitType:   '',
    licensePlate: '',
    address:      '',
  })
  const [error, setError]       = useState<string>('')
  const [checking, setChecking] = useState<boolean>(true)

  // 1) If already logged in, redirect immediately
  useEffect(() => {
    async function checkLogin(): Promise<void> {
      try {
        const res = await fetch('/api/login?includeUser=false', {
          method: 'GET',
          cache: 'no-store',
        })
        const data: { loggedIn: boolean } = await res.json()
        if (data.loggedIn) {
          router.replace('/')
        } else {
          setChecking(false)
        }
      } catch {
        setChecking(false)
      }
    }
    void checkLogin()
  }, [router])

  if (checking) return null

  // 2) Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 3) Submit registration
  const handleRegister = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')

    // Client‐side validation
    const result = RegisterSchema.safeParse(formData)
    if (!result.success) {
      setError(result.error.errors.map(err => err.message).join('; '))
      return
    }

    try {
      const res = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      })
      const data = await res.json() as RegisterSuccess | RegisterError

      if (res.status === 400) {
        // Bad request or duplicate email
        setError('error' in data ? data.error : 'Registration failed')
      } else if (res.status >= 500) {
        // Server error
        setError('Server error; please try again later.')
      } else if (res.ok) {
        // Success → pending confirmation
        router.replace('/purgatory')
      } else {
        setError('Unexpected error; please try again.')
      }
    } catch {
      setError('Network error; please check your connection.')
    }
  }

  return (
    <main className="relative flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />
      <form
        onSubmit={handleRegister}
        className="relative z-10 text-black bg-white p-6 rounded shadow-md w-full max-w-md mt-5 max-h-[90%] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <FormInput
          label="Name"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label htmlFor="permitType" className="block mb-4">
          <span className="text-gray-700">Permit Type</span>
          <select
            id="permitType"
            name="permitType"
            value={formData.permitType}
            onChange={handleChange}
            required
            className="w-full border mt-1 p-2 rounded"
          >
            <option value="">Select a permit</option>
            <option value="Resident">Resident</option>
            <option value="Commuter">Commuter</option>
            <option value="Commuter Premium">Commuter Premium</option>
            <option value="Faculty/Staff">Faculty/Staff</option>
            <option value="ADA">ADA</option>
            <option value="Other/Misc.">Other/Misc.</option>
            <option value="None">None</option>
          </select>
        </label>

        <FormInput
          label="License Plate"
          type="text"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Register
        </button>

        <p className="mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </form>
    </main>
  )
}

export default RegisterPage
