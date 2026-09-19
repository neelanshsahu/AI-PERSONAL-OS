/**
 * AuthContext — Global authentication state for the entire app.
 *
 * Provides:
 *   user        — Supabase User object (null if not logged in)
 *   session     — Full Supabase Session (includes JWT access_token)
 *   loading     — true while hydrating session on initial load
 *   signUp()    — register with email + password
 *   signIn()    — login with email + password
 *   signOut()   — clear session and redirect to /login
 *
 * Persistent login:
 *   supabase-js automatically stores the session in localStorage.
 *   On mount, getSession() hydrates it — no extra work needed.
 *
 * Usage:
 *   const { user, signIn, signOut } = useAuth()
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true) // true until initial session check done

  // ── Hydrate session on mount ────────────────────────────────────────────────
  useEffect(() => {
    // 1. Get the current session from localStorage (supabase-js handles storage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Subscribe to all subsequent auth state changes
    //    (sign in, sign out, token refresh, tab switch, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Sign up a new user with email and password.
   * Supabase sends a confirmation email if email confirmation is enabled.
   *
   * @returns {{ data, error }}
   */
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }, [])

  /**
   * Sign in an existing user with email and password.
   *
   * @returns {{ data, error }}
   */
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }, [])

  /**
   * Sign out the current user — clears session from memory and localStorage.
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  /**
   * Get the current JWT access token for API calls.
   * Returns null if not authenticated.
   */
  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  }, [])

  /**
   * Send a password reset email.
   */
  const resetPassword = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    return { data, error }
  }, [])

  /**
   * Update the user's password (requires active session).
   */
  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
  }, [])

  // ── Value ─────────────────────────────────────────────────────────────────────

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    getAccessToken,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuth — Access the auth context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>. Wrap your app in <AuthProvider>.')
  }
  return context
}

export { AuthContext }
