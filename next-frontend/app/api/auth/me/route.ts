import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const jar = await cookies()
  const raw = jar.get('auth_profile')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  return NextResponse.json(JSON.parse(raw))
}
