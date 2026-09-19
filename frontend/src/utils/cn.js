/**
 * cn — Class name utility
 * Merges conditional class strings cleanly (clsx-compatible).
 *
 * Usage:
 *   cn('base', isActive && 'active', variant === 'primary' ? 'text-brand' : 'text-gray')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
