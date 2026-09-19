/**
 * Navbar — Top navigation bar.
 * Phase 3: Adds hamburger menu for mobile sidebar toggle.
 */

import { useState } from 'react'
import { Bell, Search, LogOut, ChevronDown, Loader2, Menu } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

// ── IconButton ────────────────────────────────────────────────────────────────

function IconButton({ children, label, className, ...props }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-xl',
        'text-muted/80 hover:text-foreground',
        'bg-overlay-white/[0.04] hover:bg-overlay-white/[0.08]',
        'border border-overlay-white/[0.06] hover:border-white/[0.12]',
        'transition-all duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── User Menu ─────────────────────────────────────────────────────────────────

function UserMenu({ user, onSignOut, signingOut }) {
  const [open, setOpen] = useState(false)
  const email   = user?.email ?? 'User'
  const initial = email.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    setOpen(false)
    await onSignOut()
  }

  return (
    <div className="relative">
      <button
        id="navbar-user-menu"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 rounded-xl',
          'bg-overlay-white/[0.04] hover:bg-overlay-white/[0.08]',
          'border border-overlay-white/[0.06] hover:border-white/[0.12]',
          'transition-all duration-200',
        )}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs font-bold text-foreground select-none shrink-0">
          {initial}
        </div>
        <span className="text-sm font-medium text-muted max-w-[120px] truncate hidden sm:block">
          {email}
        </span>
        <ChevronDown
          size={13}
          className={cn('text-slate-600 transition-transform duration-200 hidden sm:block', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full mt-2 w-56 z-20',
            'rounded-2xl border border-overlay-white/[0.08]',
            'bg-surface/95 backdrop-blur-xl shadow-2xl',
            'py-1 animate-fade-in',
          )}>
            <div className="px-4 py-3 border-b border-overlay-white/[0.06]">
              <p className="text-xs text-muted/60">Signed in as</p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{email}</p>
              <Badge variant="success" dot size="sm" className="mt-2">Authenticated</Badge>
            </div>
            <button
              id="navbar-signout-btn"
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                'text-rose-400 hover:bg-rose-500/10 transition-colors duration-150',
                signingOut && 'opacity-60 cursor-not-allowed',
              )}
            >
              {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Notifications Menu ────────────────────────────────────────────────────────

function NotificationsMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <IconButton 
        label="Notifications" 
        className="relative hidden sm:flex"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={16} />
      </IconButton>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full mt-2 w-72 z-20',
            'rounded-2xl border border-overlay-white/[0.08]',
            'bg-surface/95 backdrop-blur-xl shadow-2xl',
            'py-2 animate-fade-in',
          )}>
            <div className="px-4 py-2 border-b border-overlay-white/[0.06] mb-2">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
            </div>
            <div className="px-4 py-6 text-center">
              <Bell size={24} className="text-muted/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted">No new notifications</p>
              <p className="text-xs text-muted/60 mt-1">You're all caught up!</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar({ title, onMenuClick }) {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  return (
    <header className={cn(
      'flex items-center justify-between',
      'h-16 px-4 lg:px-6',
      'border-b border-overlay-white/[0.08]',
      'bg-surface/40 backdrop-blur-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)]',
      'sticky top-0 z-10',
    )}>
      {/* ── Left ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — only visible on small screens */}
        <button
          id="navbar-menu-btn"
          aria-label="Toggle sidebar"
          onClick={onMenuClick}
          className={cn(
            'flex lg:hidden items-center justify-center w-9 h-9 rounded-xl',
            'text-muted/80 hover:text-foreground',
            'bg-overlay-white/[0.04] hover:bg-overlay-white/[0.08]',
            'border border-overlay-white/[0.06]',
            'transition-all duration-200',
          )}
        >
          <Menu size={18} />
        </button>

        <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
        <Badge variant="brand" dot size="sm" className="hidden sm:inline-flex">Live</Badge>
      </div>

      {/* ── Right ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <NotificationsMenu />
        <div className="w-px h-6 bg-overlay-white/[0.08] mx-1 hidden sm:block" />
        <UserMenu user={user} onSignOut={handleSignOut} signingOut={signingOut} />
      </div>
    </header>
  )
}
