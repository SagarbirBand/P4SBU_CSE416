// app/api/register/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse }     from 'next/server'
import { supabase }         from '../lib/db.js'
import bcrypt               from 'bcrypt'
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken'
import { z }                from 'zod'

/** 
 * Secret must never be exposed client-side.
 * Define JWT_SECRET in your server environment.
 */
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

/** Zod schema to validate incoming registration data */
const RegisterSchema = z.object({
  fullName:     z.string().min(1,      'Full name is required'),
  email:        z.string().email(      'Invalid email address'),
  password:     z.string().min(8,      'Password must be at least 8 characters'),
  permitType:   z.string().min(1,      'Permit type is required'),
  licensePlate: z.string().min(1,      'License plate is required'),
  address:      z.string().min(1,      'Address is required'),
})

/** Shape of a validated request body */
interface RegisterRequest {
  fullName:     string
  email:        string
  password:     string
  permitType:   string
  licensePlate: string
  address:      string
}

/** Mirror of your “users” table row */
interface DBUser {
  id:            string
  name:          string
  email:         string
  passBcrypt:    string
  permitType:    string
  isAuth:        boolean      // admin flag
  licensePlate:  string
  address:       string
  isConfirmed:   boolean      // admin approval
}

/** What we send back to the client */
interface UserResponse {
  id:            string
  name:          string
  email:         string
  permitType:    string
  isAdmin:       boolean
  licensePlate:  string
  address:       string
  isConfirmed:   boolean
}

type ErrorResponse   = { error: string }
type SuccessResponse = { message: string; user: UserResponse }

/** 
 * Helper: sign a JWT with an expiresIn in seconds 
 * (avoids TS overload issues by passing number)
 */
function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresInSec: number
): string {
  const opts: SignOptions = { expiresIn: expiresInSec }
  return jwt.sign(payload, JWT_SECRET as Secret, opts)
}

/**
 * POST /api/register
 * 1. Validate payload
 * 2. Prevent duplicate emails
 * 3. Hash password
 * 4. Insert new user (unconfirmed, non-admin)
 * 5. Issue a 7-day JWT cookie
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {

  // 1) Validate the request body
  let body: RegisterRequest
  try {
    body = RegisterSchema.parse(await request.json())
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors.map(e => e.message).join('; ')
        : 'Invalid registration data'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { fullName, email, password, permitType, licensePlate, address } = body

  // 2) Ensure email isn’t already taken
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    )
  }
  if (existingUser) {
    return NextResponse.json(
      { error: 'A user with that email already exists' },
      { status: 400 }
    )
  }

  // 3) Hash the password
  const passBcrypt = await bcrypt.hash(password, 12)

  // 4) Insert the new user record
  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert([{
      name:         fullName,
      email,
      passBcrypt,
      permitType,
      licensePlate,
      address,
      isAuth:      false,
      isConfirmed: false,
    }])
    .select()
    .single()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message || 'Registration failed' },
      { status: 500 }
    )
  }

  // 5) Issue a JWT (7 days) and set as httpOnly cookie
  const maxAge = 7 * 24 * 60 * 60  // seconds in 7 days
  const token  = signJwt({ id: inserted.id, name: inserted.name }, maxAge)

  // Construct the payload we send back
  const userResp: UserResponse = {
    id:           inserted.id,
    name:         inserted.name,
    email:        inserted.email,
    permitType:   inserted.permitType,
    isAdmin:      inserted.isAuth,
    licensePlate: inserted.licensePlate,
    address:      inserted.address,
    isConfirmed:  inserted.isConfirmed,
  }

  const res = NextResponse.json<SuccessResponse>({
    message: 'User registered successfully',
    user:    userResp,
  })
  res.cookies.set({
    name:     'token',
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge,   // seconds
    path:     '/',
    sameSite: 'strict',
  })

  return res
}
