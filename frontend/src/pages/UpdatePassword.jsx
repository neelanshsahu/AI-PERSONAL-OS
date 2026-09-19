import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { InputField } from '@/components/ui/InputField'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { cn } from '@/utils/cn'

export default function UpdatePassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    const { error } = await updatePassword(password)
    setSubmitting(false)

    if (error) {
      setError(error.message ?? 'Failed to update password.')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* ── Background ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-accent-500/8  blur-3xl" />
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
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="relative flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand">
            <Zap size={26} className="text-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Update Password</h1>
            <p className="text-xs text-muted/60 mt-0.5">Please enter your new password</p>
          </div>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            Password updated successfully. Redirecting to dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <InputField
              id="new-password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
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
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <InputField
              id="confirm-password"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />

            <ErrorAlert message={error} />

            <button
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
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
