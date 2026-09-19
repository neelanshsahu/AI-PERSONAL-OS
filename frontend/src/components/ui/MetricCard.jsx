import { cn } from '@/utils/cn'

const colorMap = {
  brand:  { bg: 'bg-brand-500/10',   text: 'text-brand-400'   },
  accent: { bg: 'bg-accent-500/10',  text: 'text-accent-400'  },
  green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  amber:  { bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
}

export function MetricCard({ label, value, icon: Icon, color = 'brand' }) {
  const { bg, text } = colorMap[color] ?? colorMap.brand
  return (
    <div className={cn(
      'flex flex-col gap-3 p-5 rounded-2xl border border-overlay-white/[0.06]',
      'bg-overlay-white/[0.03] hover:bg-overlay-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-brand',
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', bg)}>
          <Icon size={18} className={text} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted/60 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
