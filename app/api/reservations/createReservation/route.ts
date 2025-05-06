// app/api/reservations/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse }     from 'next/server'
import { cookies }         from 'next/headers'
import { z }               from 'zod'
import { supabase }        from '../../lib/db'
import { getUserFromToken } from '../../lib/auth'

/**
 * Schema to coerce and validate reservation fields.
 * Ensures all IDs are numbers (matching BIGINT columns)
 * and times are valid ISO strings.
 */
const ReservationSchema = z.object({
  userID: z.preprocess(
    val => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int({ message: 'userID must be an integer' })
  ),
  spotID: z.preprocess(
    val => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int({ message: 'spotID must be an integer' })
  ),
  paymentID: z.preprocess(
    val => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int({ message: 'paymentID must be an integer' })
  ),
  startTime: z
    .string({ required_error: 'startTime is required' })
    .refine((s) => !isNaN(Date.parse(s)), { message: 'startTime must be a valid ISO date' }),
  endTime: z
    .string({ required_error: 'endTime is required' })
    .refine((s) => !isNaN(Date.parse(s)), { message: 'endTime must be a valid ISO date' }),
})
type ReservationRequest = z.infer<typeof ReservationSchema>

export async function POST(request: NextRequest) {
  // 1) Authenticate
  const token = (await cookies()).get('token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let authUser: { id: string }
  try {
    authUser = await getUserFromToken(token)
    if (!authUser) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 2) Parse & validate request body
  let body: ReservationRequest
  try {
    body = ReservationSchema.parse(await request.json())
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors.map((e) => e.message).join('; ')
        : 'Invalid request payload'
    console.log(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { userID, spotID, paymentID, startTime, endTime } = body

  // 3) Authorize: user may only reserve for themselves
  if (parseInt(authUser.id, 10) !== userID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 4) (Optional) Check spot availability...
    const { data: spot, error: spotErr } = await supabase
      .from('parkingSpotTypes')
      .select('currentAvailable')
      .eq('id', spotID)
      .single()
    if (spotErr) throw spotErr
    if (spot.currentAvailable <= 0) {
      return NextResponse.json({ error: 'No spots available' }, { status: 409 })
    }

    // 5) Insert reservation
    const { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .insert([{ userID, spotID, paymentID, startTime, endTime }])
      .select('*')
      .single()

    if (resErr || !reservation) {
      throw resErr ?? new Error('Failed to create reservation')
    }

    // 6) Success
    return NextResponse.json({ success: true, id: reservation.id }, { status: 201 })
  } catch (err: any) {
    const message = err?.message ?? 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
