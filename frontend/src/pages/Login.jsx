/**
 * Login Page — Phase 2 functional authentication.
 *
 * Features:
 *   - Tab toggle between Sign In and Sign Up
 *   - Real Supabase auth calls via AuthContext
 *   - Loading states, error messages, success state
 *   - Post-login redirect (preserves intended destination)
 *   - "Check your email" screen after sign-up
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { InputField } from '@/components/ui/InputField'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { cn } from '@/utils/cn'


// ── Success Screen (after sign up) ────────────────────────────────────────────

function CheckEmailScreen({ email, onBack }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center py-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Check your email</h2>
        <p className="text-sm text-muted/80 mt-2 leading-relaxed max-w-[260px]">
          We sent a confirmation link to{' '}
          <span className="text-foreground font-medium">{email}</span>.
          Click it to activate your account.
        </p>
      </div>
      <button
        onClick={onBack}
        className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
      >
        ← Back to sign in
      </button>
    </div>
  )
}

// ── Tab Button ────────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
        active
          ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
          : 'text-muted/60 hover:text-muted border border-transparent',
      )}
    >
      {label}
    </button>
  )
}

// ── Login Page ────────────────────────────────────────────────────────────────

export default function Login() {
  const { isAuthenticated, loading, signIn, signUp, resetPassword } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Where to go after login (if user was redirected from a protected route)
  const from = location.state?.from?.pathname ?? '/'

  // ── Redirect if already logged in ──────────────────────────────────────────
  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Reset error when switching tabs
  useEffect(() => {
    setError('')
    setEmail('')
    setPassword('')
    setSignUpSuccess(false)
    setResetSuccess(false)
  }, [tab])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setSubmitting(true)
    setError('')
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error.message ?? 'Sign in failed. Please try again.')
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSubmitting(true)
    setError('')
    const { data, error } = await signUp(email, password)
    setSubmitting(false)
    if (error) {
      setError(error.message ?? 'Sign up failed. Please try again.')
    } else {
      // If email confirmation is disabled in Supabase, user is auto-logged in
      if (data?.session) {
        navigate(from, { replace: true })
      } else {
        setSignUpSuccess(true)
      }
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setSubmitting(true)
    setError('')
    const { error } = await resetPassword(email)
    setSubmitting(false)
    if (error) {
      setError(error.message ?? 'Failed to send reset link.')
    } else {
      setResetSuccess(true)
    }
  }

  const isSignIn = tab === 'signin'
  const isForgot = tab === 'forgot'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">

      {/* ── Background ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-accent-500/8  blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)
            `,
            backgroundSize: '52px 52px',
          }}
        />
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm mx-4 animate-fade-in',
          'rounded-3xl border border-overlay-white/[0.08]',
          'bg-surface/70 backdrop-blur-2xl',
          'p-8 shadow-2xl',
        )}
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="relative flex items-center justify-center w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand">
            <Zap size={26} className="text-foreground" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-400 border-2 border-surface-900 animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground tracking-tight">AI Personal OS</h1>
            <p className="text-xs text-muted/60 mt-0.5">Your intelligent workspace</p>
          </div>
        </div>

        {/* ── Tab Toggle ───────────────────────────────────────────────────── */}
        {!signUpSuccess && !resetSuccess && !isForgot && (
          <div className="flex gap-1.5 p-1 rounded-xl bg-overlay-white/[0.03] border border-overlay-white/[0.06] mb-6">
            <TabButton
              id="tab-signin"
              label="Sign In"
              active={isSignIn}
              onClick={() => setTab('signin')}
            />
            <TabButton
              id="tab-signup"
              label="Sign Up"
              active={!isSignIn}
              onClick={() => setTab('signup')}
            />
          </div>
        )}

        {/* ── Check Email Success ───────────────────────────────────────────── */}
        {signUpSuccess ? (
          <CheckEmailScreen
            email={email}
            onBack={() => { setTab('signin'); setSignUpSuccess(false) }}
          />
        ) : (

          /* ── Form ────────────────────────────────────────────────────────── */
          <form
            onSubmit={isSignIn ? handleSignIn : isForgot ? handleResetPassword : handleSignUp}
            className="flex flex-col gap-4"
            noValidate
          >
            <InputField
              id="auth-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />

            {/* Password Field (hidden in forgot mode) */}
            {!isForgot && (
              <InputField
                id="auth-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignIn ? '••••••••' : 'Min. 6 characters'}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-600 hover:text-muted/80 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            )}

            {/* Forgot password — only on sign in */}
            {isSignIn && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Reset Success Message */}
            {resetSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                A password reset link has been sent to your email.
              </div>
            )}

            {/* Error */}
            <ErrorAlert message={error} />

            {/* Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting}
              className={cn(
                'mt-1 flex items-center justify-center gap-2',
                'w-full py-3 rounded-xl text-sm font-semibold text-foreground',
                'bg-gradient-to-r from-brand-600 to-accent-600',
                'hover:from-brand-500 hover:to-accent-500',
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-brand',
                submitting && 'opacity-70 cursor-not-allowed hover:translate-y-0',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isForgot ? 'Sending...' : isSignIn ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {isForgot ? 'Send Reset Link' : isSignIn ? 'Sign in' : 'Create account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        {!signUpSuccess && (
          <p className="text-center text-xs text-slate-600 mt-5">
            {isForgot ? (
              <button
                onClick={() => setTab('signin')}
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                Back to Sign In
              </button>
            ) : (
              <>
                {isSignIn ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setTab(isSignIn ? 'signup' : 'signin')}
                  className="text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {isSignIn ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
