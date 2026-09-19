import { AlertCircle } from 'lucide-react'

export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
      <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
      <p className="text-xs text-rose-400 leading-relaxed">{message}</p>
    </div>
  )
}
