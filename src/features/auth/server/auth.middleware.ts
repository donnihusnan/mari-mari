import { createMiddleware } from '@tanstack/react-start'
import { readSessionToken, clearSessionCookie } from './session'
import { verifyServerSession } from '@/lib/supabase.server'

export interface AuthContextUser {
  id: string
  email: string
}

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const token = readSessionToken()
  if (!token) {
    throw new Error('UNAUTHORIZED: Sesi tidak ditemukan')
  }

  const user = await verifyServerSession(token)
  if (!user || !user.email) {
    clearSessionCookie()
    throw new Error('UNAUTHORIZED: Sesi kadaluarsa atau tidak valid')
  }

  return next({
    context: {
      user: {
        id: user.id,
        email: user.email,
      } as AuthContextUser,
    },
  })
})
