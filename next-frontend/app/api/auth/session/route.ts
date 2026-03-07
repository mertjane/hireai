import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const TTL_REMEMBER = 60 * 60 * 24 * 30 // 30 days
const secure = process.env.NODE_ENV === 'production'

export async function POST(req: Request) {
  const { token, refreshToken, profile, rememberMe } = await req.json()
  if (!token || !profile) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // rememberMe = true  → persistent cookie (30 days)
  // rememberMe = false → session cookie (no maxAge key at all, expires when browser closes)
  const base = { secure, sameSite: 'lax' as const, path: '/' }
  const opts      = rememberMe ? { ...base, maxAge: TTL_REMEMBER } : base
  const optsHttp  = rememberMe ? { ...base, httpOnly: true, maxAge: TTL_REMEMBER } : { ...base, httpOnly: true }

  const jar = await cookies()
  // httpOnly — route protection via middleware
  jar.set('auth_token', token, optsHttp)
  // readable — axios interceptor uses this as Bearer token for backend API calls
  jar.set('auth_token_client', token, opts)
  // readable — company profile (name, email, id)
  jar.set('auth_profile', JSON.stringify(profile), opts)
  // httpOnly — used to silently refresh the Firebase ID token when it expires
  if (refreshToken) {
    jar.set('auth_refresh_token', refreshToken, optsHttp)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.delete('auth_token')
  jar.delete('auth_token_client')
  jar.delete('auth_profile')
  jar.delete('auth_refresh_token')
  return NextResponse.json({ ok: true })
}
