import { createServerFn } from '@tanstack/react-start'
import { loginSchema } from '../schemas'
import { readSessionToken, setSessionCookie, clearSessionCookie } from './session'
import { supabaseServer, verifyServerSession } from '@/lib/supabase.server'

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, password } = data
    const { data: authData, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !authData.session || !authData.user) {
      throw new Error(error?.message || 'Email atau password salah')
    }

    setSessionCookie(authData.session.access_token)

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email ?? '',
      },
    }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  clearSessionCookie()
  return { success: true }
})

export const getAuthSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = readSessionToken()
    if (!token) {
      return { user: null }
    }

    const user = await verifyServerSession(token)
    if (!user || !user.email) {
      clearSessionCookie()
      return { user: null }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    }
  },
)
