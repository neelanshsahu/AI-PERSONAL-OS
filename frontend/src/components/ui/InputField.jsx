import { cn } from '@/utils/cn'

export function InputField({ label, type = 'text', placeholder, icon: Icon, value, onChange, disabled, rightElement, id }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted/80">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm',
            'bg-overlay-white/[0.04] border border-overlay-white/[0.08]',
            'text-foreground placeholder:text-slate-600',
            'focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07] focus:ring-1 focus:ring-brand-500/30',
            'transition-all duration-200',
            Icon && 'pl-10',
            rightElement && 'pr-10',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
