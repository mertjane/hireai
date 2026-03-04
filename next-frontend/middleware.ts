import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  const { pathname } = req.nextUrl

  // Protected: must be logged in
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Auth page: already logged in → go to dashboard
  if (pathname.startsWith('/auth') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
