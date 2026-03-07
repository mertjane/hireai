import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const TTL = 60 * 60 * 24 * 7
const secure = process.env.NODE_ENV === 'production'

export async function POST(req: Request) {
  const { token, refreshToken, profile } = await req.json()
  if (!token || !profile) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const jar = await cookies()
  // httpOnly — route protection via middleware
  jar.set('auth_token', token, { httpOnly: true, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
  // readable — axios interceptor uses this as Bearer token for backend API calls
  jar.set('auth_token_client', token, { httpOnly: false, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
  // readable — company profile (name, email, id)
  jar.set('auth_profile', JSON.stringify(profile), { httpOnly: false, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
  // httpOnly — used to silently refresh the Firebase ID token when it expires
  if (refreshToken) {
    jar.set('auth_refresh_token', refreshToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
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
