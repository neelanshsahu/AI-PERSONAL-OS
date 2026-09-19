/**
 * useSidebar — Manages sidebar open/collapsed state.
 *
 * Defaults:
 *   Desktop (>= 1024px) → open
 *   Mobile  (<  1024px) → closed (prevent overlay on first load)
 *
 * Returns:
 *   isOpen  — current open state
 *   toggle  — flip open/closed
 *   open    — force open
 *   close   — force closed
 */

import { useState, useCallback } from 'react'

/** Read screen width only once at mount — avoids SSR issues */
function getInitialOpen() {
  if (typeof window === 'undefined') return true
  return window.innerWidth >= 1024
}

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(getInitialOpen)

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])

  return { isOpen, toggle, open, close }
}
