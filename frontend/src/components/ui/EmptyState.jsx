import { cn } from '@/utils/cn'

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-white/[0.05] rounded-3xl bg-white/[0.01]">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-overlay-white/[0.03] flex items-center justify-center mb-4">
          <Icon size={32} className="text-slate-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted/60 max-w-sm mb-6">{description}</p>
      {action && action}
    </div>
  )
}
