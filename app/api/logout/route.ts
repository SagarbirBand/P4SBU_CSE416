// app/api/logout/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse }     from 'next/server'

/**
 * GET /api/logout
 * 
 * Clears the auth cookie and redirects to the homepage.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  // Build absolute URL to the root path
  const redirectUrl: URL = new URL('/', request.url)

  // Issue a 307 redirect to '/'
  const response: NextResponse = NextResponse.redirect(redirectUrl, 307)

  // Delete the 'token' cookie (HttpOnly, same path as when set)
  response.cookies.delete({ name: 'token'})

  return response
}
