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
  console.log('[auth/callback] incoming cookies:', request.cookies.getAll().map(c => c.name))

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
        console.error('[auth/callback] exchangeCodeForSession error:', error.message)
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
