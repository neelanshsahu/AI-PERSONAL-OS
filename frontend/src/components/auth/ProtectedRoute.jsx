/**
 * ProtectedRoute — Route guard component.
 *
 * Behavior:
 *   loading        → renders a full-screen loading spinner (prevents flash)
 *   not logged in  → redirects to /login (preserving the intended destination)
 *   logged in      → renders children
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/" element={<Dashboard />} />
 *   </Route>
 *
 * Or wrapping a specific component:
 *   <ProtectedRoute><Dashboard /></ProtectedRoute>
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// ── Loading Screen ────────────────────────────────────────────────────────────

function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 z-50">
      {/* Animated logo mark */}
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand animate-pulse-slow">
        <Zap size={28} className="text-foreground" />
      </div>

      {/* Spinner ring */}
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-brand-400 animate-spin" />

      <p className="text-sm text-muted/60 tracking-wide">Loading session…</p>
    </div>
  )
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show full-screen loader while Supabase hydrates the session
  if (loading) {
    return <AuthLoadingScreen />
  }

  // Not authenticated — redirect to /login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated — render children OR the layout outlet
  return children ? <>{children}</> : <Outlet />
}
