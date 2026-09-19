/**
 * Card — Reusable glass-morphism card component.
 *
 * Props:
 *   children    — card content
 *   className   — extra Tailwind classes
 *   hover       — enable hover lift effect (default: true)
 *   padding     — padding size: 'sm' | 'md' | 'lg' (default: 'md')
 *   glow        — show brand glow on hover (default: false)
 */

import { cn } from '@/utils/cn'

const paddingMap = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({
  children,
  className,
  hover = true,
  padding = 'md',
  glow = false,
  ...props
}) {
  return (
    <div
      className={cn(
        // Base (using global glass utility)
        'glass rounded-2xl',
        // Padding
        paddingMap[padding],
        // Hover
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:border-overlay-white/[0.15] hover:bg-overlay-white/[0.06] hover:shadow-lg hover:shadow-black/20',
        // Glow
        glow && 'hover:shadow-glow-brand',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * StatCard — Metric display card used on the Dashboard.
 *
 * Props:
 *   label     — metric label string
 *   value     — metric value string/number
 *   icon      — Lucide icon component
 *   change    — change string e.g. '+12%'
 *   positive  — whether change is positive (green) or negative (red)
 *   color     — accent color class for icon bg
 */
export function StatCard({ label, value, icon: Icon, change, positive = true, color = 'brand' }) {
  const colorMap = {
    brand:  { bg: 'bg-brand-500/10',  text: 'text-brand-400' },
    accent: { bg: 'bg-accent-500/10', text: 'text-accent-400' },
    green:  { bg: 'bg-emerald-500/10',text: 'text-emerald-400' },
    amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400' },
    rose:   { bg: 'bg-rose-500/10',   text: 'text-rose-400' },
  }
  const { bg, text } = colorMap[color] ?? colorMap.brand

  return (
    <Card glow className="flex flex-col gap-4 animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', bg)}>
          {Icon && <Icon size={20} className={text} />}
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              positive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400',
            )}
          >
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-sm text-muted/80 mt-0.5">{label}</p>
      </div>
    </Card>
  )
}
