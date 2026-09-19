/**
 * useAuth — Convenience re-export of the auth hook.
 *
 * Importing from here instead of directly from AuthContext
 * keeps imports shorter and makes refactoring easier.
 *
 * Usage:
 *   import { useAuth } from '@/hooks/useAuth'
 *   const { user, signOut, loading } = useAuth()
 */

export { useAuth } from '@/context/AuthContext'
