/**
 * Badge — Status indicator pill component.
 *
 * Props:
 *   children  — label text
 *   variant   — 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand'
 *   dot       — show animated dot indicator (default: false)
 *   size      — 'sm' | 'md' (default: 'sm')
 */

import { cn } from '@/utils/cn'

const variantMap = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]',
  warning: 'bg-amber-500/10  text-amber-400  border-amber-500/30 shadow-[0_0_12px_-3px_rgba(245,158,11,0.3)]',
  error:   'bg-rose-500/10   text-rose-400   border-rose-500/30 shadow-[0_0_12px_-3px_rgba(225,29,72,0.3)]',
  info:    'bg-sky-500/10    text-sky-400    border-sky-500/30 shadow-[0_0_12px_-3px_rgba(14,165,233,0.3)]',
  brand:   'bg-brand-500/10  text-brand-400  border-brand-500/30 shadow-[0_0_12px_-3px_rgba(6,182,212,0.3)]',
  neutral: 'bg-slate-500/10  text-muted/80   border-slate-500/30 shadow-[0_0_12px_-3px_rgba(100,116,139,0.3)]',
}

const dotColorMap = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error:   'bg-rose-400',
  info:    'bg-sky-400',
  brand:   'bg-brand-400',
  neutral: 'bg-slate-400',
}

const sizeMap = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({ children, variant = 'neutral', dot = false, size = 'sm', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', dotColorMap[variant])} />
      )}
      {children}
    </span>
  )
}
