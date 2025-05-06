// app/api/login/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse }    from 'next/server'
import bcrypt              from 'bcrypt'
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken'
import { supabase }        from '../lib/db.js'
import { getUserFromToken } from '../lib/auth.js'
import { z }               from 'zod'

/** Ensure this secret is only server-side */
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable')

/** Validate incoming body */
const LoginSchema = z.object({
  email:        z.string().email(),
  password:     z.string().min(1),
  stayLoggedIn: z.boolean().optional(),
})

/** Database row type */
interface DBUser {
  id: string
  name: string
  email: string
  passBcrypt: string
  permitType: string
  isAuth: boolean      // admin flag
  licensePlate: string
  address: string
  isConfirmed: boolean // approved by admin
}

/** Payload sent back to client */
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

interface LoginRequest {
  email: string
  password: string
  stayLoggedIn?: boolean
}

type ErrorResponse   = { error: string }
type SuccessResponse = { message: string; user: UserResponse }
type AuthCheckResponse =
  | { loggedIn: false }
  | { loggedIn: true; user?: UserResponse }

/** Sign a JWT, with expiresIn in seconds */
function signJwt(
  payload: Omit<JwtPayload, 'iat'|'exp'>,
  expiresInSec: number
): string {
  const opts: SignOptions = { expiresIn: expiresInSec }
  return jwt.sign(payload, JWT_SECRET as Secret, opts)
}

/**
 * PUT /api/login
 * — validate credentials
 * — issue JWT cookie + return user info
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<SuccessResponse|ErrorResponse>> {
  // parse & validate
  let body: LoginRequest
  try {
    body = LoginSchema.parse(await request.json())
  } catch (e) {
    const msg =
      e instanceof z.ZodError
        ? e.errors.map(err => err.message).join('; ')
        : 'Invalid request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  const { email, password, stayLoggedIn = false } = body

  // lookup user — drop generics to satisfy supabase API
  const resp = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  const user = resp.data as DBUser | null
  const error = resp.error

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // verify password
  if (!(await bcrypt.compare(password, user.passBcrypt))) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // sign token & set cookie
  const maxAge = stayLoggedIn ? 7 * 24 * 60 * 60 : 2 * 60 * 60
  const token  = signJwt({ id: user.id, name: user.name }, maxAge)

  // prepare user payload
  const userResp: UserResponse = {
    id:           user.id,
    name:         user.name,
    email:        user.email,
    permitType:   user.permitType,
    isAdmin:      user.isAuth,
    licensePlate: user.licensePlate,
    address:      user.address,
    isConfirmed:  user.isConfirmed,
  }

  const res = NextResponse.json<SuccessResponse>({
    message: 'Login successful',
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

/**
 * GET /api/login
 * — check session; optionally return user
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AuthCheckResponse>> {
  const includeUser = request.nextUrl.searchParams.get('includeUser') === 'true'
  const token       = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ loggedIn: false })
  }

  try {
    const dbUser = await getUserFromToken(token) as DBUser | null
    if (!dbUser) {
      const res = NextResponse.json<AuthCheckResponse>({ loggedIn: false })
      res.cookies.delete({ name: 'token', path: '/' })
      return res
    }

    const userResp: UserResponse = {
      id:           dbUser.id,
      name:         dbUser.name,
      email:        dbUser.email,
      permitType:   dbUser.permitType,
      isAdmin:      dbUser.isAuth,
      licensePlate: dbUser.licensePlate,
      address:      dbUser.address,
      isConfirmed:  dbUser.isConfirmed,
    }

    return includeUser
      ? NextResponse.json({ loggedIn: true, user: userResp })
      : NextResponse.json({ loggedIn: true })
  } catch {
    const res = NextResponse.json<AuthCheckResponse>({ loggedIn: false })
    res.cookies.delete({ name: 'token', path: '/' })
    return res
  }
}
