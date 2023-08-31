import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseCookies } from 'nookies'

export function middleware(request: NextRequest) {
  const { 'nextauth.token': token } = parseCookies()

  if(!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/events/create', 'events/update', '/user*'],
}