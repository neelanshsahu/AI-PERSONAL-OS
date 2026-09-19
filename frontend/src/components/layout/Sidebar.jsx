/**
 * Sidebar — Responsive collapsible navigation sidebar.
 *
 * Desktop (lg+): Collapses to 68px icon rail / expands to 240px
 * Mobile (<lg):  Fixed overlay, slides in from left
 *
 * Props:
 *   isOpen   — boolean
 *   onToggle — flip open/closed (desktop collapse button)
 *   onClose  — force close (called from mobile backdrop click)
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  CalendarDays,
  Sparkles,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Navigation Definition ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/chat',           icon: MessageSquare,   label: 'Chat'            },
  { to: '/knowledge-base', icon: BookOpen,        label: 'Knowledge Base'  },
  { to: '/planner',        icon: CalendarDays,    label: 'Planner'         },
  { to: '/image-generator',icon: Sparkles,        label: 'Image Generator' },
  { to: '/analytics',      icon: BarChart3,       label: 'Analytics'       },
]

const BOTTOM_ITEMS = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ to, icon: Icon, label, isOpen }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={!isOpen ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
          'transition-all duration-200 border',
          isActive
            ? 'bg-brand-500/20 text-brand-300 border-brand-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
            : 'text-muted/80 hover:bg-white/[0.05] hover:text-foreground border-transparent',
          !isOpen && 'justify-center px-2.5',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-brand-400' : 'text-muted/60 group-hover:text-muted',
            )}
          />
          {isOpen && (
            <span className="truncate animate-fade-in">{label}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onToggle, onClose }) {
  return (
    <aside
      className={cn(
        // Layout — fixed on mobile, relative on desktop
        'fixed lg:relative inset-y-0 left-0 z-30',
        'flex flex-col h-full shrink-0',
        // Appearance
        'bg-surface/50 backdrop-blur-3xl shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.05)]',
        'border-r border-overlay-white/[0.08]',
        // Smooth transition for both width (desktop) and position (mobile)
        'transition-all duration-300 ease-in-out',
        // Width — always 240px on mobile, collapses on desktop
        isOpen ? 'w-60' : 'w-60 lg:w-[68px]',
        // Mobile: slide in/out via transform; desktop: always translate-x-0
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-overlay-white/[0.06] shrink-0',
          !isOpen && 'lg:justify-center lg:px-0',
        )}
      >
        <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand">
          <Zap size={16} className="text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
        </div>

        {isOpen && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-sm font-bold text-foreground leading-none tracking-tight">AI Personal</p>
            <p className="text-[10px] font-semibold text-brand-400 tracking-widest uppercase mt-0.5">OS</p>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} isOpen={isOpen} />
        ))}
      </nav>

      {/* ── Bottom ────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-overlay-white/[0.06] flex flex-col gap-1 shrink-0">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} isOpen={isOpen} />
        ))}
      </div>

      {/* ── Desktop collapse toggle ────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className={cn(
          'hidden lg:flex',
          'absolute -right-3 top-[72px]',
          'items-center justify-center',
          'w-6 h-6 rounded-full',
          'bg-surface border border-overlay-white/[0.10]',
          'text-muted/80 hover:text-foreground',
          'transition-all duration-300 hover:scale-110 hover:bg-surface-hover',
          'shadow-lg z-10',
        )}
      >
        <ChevronLeft
          size={12}
          className={cn('transition-transform duration-300', !isOpen && 'rotate-180')}
        />
      </button>
    </aside>
  )
}
