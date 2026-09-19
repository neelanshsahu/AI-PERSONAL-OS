import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export function SelectField({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted/60">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm',
            'bg-overlay-white/[0.04] border border-overlay-white/[0.08] text-muted',
            'focus:outline-none focus:border-brand-500/40 focus:bg-overlay-white/[0.06]',
            'group-hover:border-white/[0.12] transition-all duration-200 cursor-pointer',
          )}
        >
          {options.map((o) => <option key={o} value={o} className="bg-surface">{o}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-muted/80 transition-colors" />
      </div>
    </div>
  )
}
