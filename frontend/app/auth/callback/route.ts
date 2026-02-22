import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Build origin from proxy headers so redirects work behind Nginx
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin

  console.log('[auth/callback] origin:', origin, '| code present:', !!code)
  console.log('[auth/callback] request.url:', request.url)

  // Log raw cookie header to detect proxy corruption
  const rawCookieHeader = request.headers.get('cookie')
  console.log('[auth/callback] raw Cookie header:', rawCookieHeader)

  const allCookies = request.cookies.getAll()
  allCookies.forEach(c => {
    console.log(`[auth/callback] cookie "${c.name}" value (first 80 chars):`, c.value.substring(0, 80))
  })

  // Create the redirect response FIRST so we can set cookies directly on it
  const response = NextResponse.redirect(new URL('/dashboard', origin))

  if (code) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              console.log('[auth/callback] setting cookies:', cookiesToSet.map(c => c.name))
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[auth/callback] exchangeCodeForSession error:', error.message, '| status:', error.status)
      } else {
        console.log('[auth/callback] session established for user:', data.user?.email)
      }
    } catch (error) {
      console.error('[auth/callback] unexpected error:', error)
    }
  }

  console.log('[auth/callback] response cookies:', response.cookies.getAll().map(c => c.name))
  return response
}
