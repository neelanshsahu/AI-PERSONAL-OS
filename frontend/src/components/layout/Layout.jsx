/**
 * Layout — App shell with responsive sidebar support.
 *
 * Phase 3 additions:
 *   - Mobile backdrop overlay (clicks outside sidebar to close it)
 *   - Auto-close sidebar on route change (mobile UX)
 *   - Passes onMenuClick to Navbar for hamburger button
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/utils/cn'

// Route → Page title map
const PAGE_TITLES = {
  '/':                 'Dashboard',
  '/chat':             'AI Chat',
  '/knowledge-base':   'Knowledge Base',
  '/planner':          'Planner',
  '/image-generator':  'Image Generator',
  '/analytics':        'Analytics',
  '/settings':         'Settings',
}

export function Layout() {
  const { isOpen, toggle, close } = useSidebar()
  const { pathname } = useLocation()

  const title = PAGE_TITLES[pathname] ?? 'AI Personal OS'

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    close()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Mobile backdrop — tap outside to close ────────────────────────── */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <Sidebar isOpen={isOpen} onToggle={toggle} onClose={close} />

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0 overflow-hidden',
        'transition-all duration-300',
      )}>
        <Navbar title={title} onMenuClick={toggle} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
