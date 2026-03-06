import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const TTL = 60 * 60 * 24 * 7
const secure = process.env.NODE_ENV === 'production'

export async function POST() {
  const jar = await cookies()
  const refreshToken = jar.get('auth_refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Firebase API key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      }
    )

    if (!res.ok) {
      // Refresh token is invalid or revoked — force logout
      jar.delete('auth_token')
      jar.delete('auth_token_client')
      jar.delete('auth_profile')
      jar.delete('auth_refresh_token')
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
    }

    const data = await res.json()
    const newIdToken: string = data.id_token
    const newRefreshToken: string = data.refresh_token

    // Update both token cookies and the refresh token
    jar.set('auth_token', newIdToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
    jar.set('auth_token_client', newIdToken, { httpOnly: false, secure, sameSite: 'lax', maxAge: TTL, path: '/' })
    jar.set('auth_refresh_token', newRefreshToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: TTL, path: '/' })

    return NextResponse.json({ token: newIdToken })
  } catch {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
