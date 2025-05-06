// app/api/payments/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse }     from 'next/server'
import { cookies }         from 'next/headers'
import Stripe              from 'stripe'
import { getUserFromToken } from '../../lib/auth'
import { supabase }        from '../../lib/db'
import { z }               from 'zod'

/** Ensure Stripe secret is set */
const stripeSecret = process.env.STRIPE_SECRET_KEY
if (!stripeSecret) throw new Error('Missing STRIPE_SECRET_KEY environment variable')

const stripe = new Stripe(stripeSecret, { apiVersion: '2025-04-30.basil' })

/**
 * Coerce userID to a number (client may send string or number)
 * then validate it's an integer.
 */
const PaymentSchema = z.object({
  userID: z.preprocess(
    val => {
      if (typeof val === 'string') return parseInt(val, 10)
      return val
    },
    z.number().int({ message: 'userID must be an integer' })
  ),
  amount: z.number().positive({ message: 'amount must be a positive number' }),
})
type PaymentRequest = z.infer<typeof PaymentSchema>

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | { clientSecret: string; dbPaymentId: number }
    | { error: string }
  >
> {
  // 1) Authenticate via token cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
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

  // 2) Parse & validate body (coercing userID to number)
  let body: PaymentRequest
  try {
    body = PaymentSchema.parse(await request.json())
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors.map(e => e.message).join('; ')
        : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
  const { userID, amount } = body

  // 3) Authorization: ensure userID matches authenticated user
  const authUserId = parseInt(authUser.id, 10)
  if (authUserId !== userID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4) Create Stripe PaymentIntent
  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { userID: String(userID) },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5) Log payment to database, returning the inserted row
  const { data, error: dbError } = await supabase
    .from('payments')
    .insert([{ userID, amount, miscStatus: null }])
    .select('*')
    .single()

  if (dbError || !data) {
    // Roll back Stripe intent on DB failure
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id)
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: dbError?.message ?? 'Database error' },
      { status: 500 }
    )
  }

  // 6) Respond with clientSecret & the DB's payment ID
  return NextResponse.json(
    {
      clientSecret: paymentIntent.client_secret as string,
      dbPaymentId:  data.id,
    },
    { status: 201 }
  )
}
