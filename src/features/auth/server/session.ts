import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'

export const SESSION_COOKIE_NAME = 'mm_session'

export function readSessionToken(): string | null {
  try {
    const token = getCookie(SESSION_COOKIE_NAME)
    return token ? String(token) : null
  } catch {
    return null
  }
}

export function setSessionCookie(token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE_NAME, {
    path: '/',
  })
}
