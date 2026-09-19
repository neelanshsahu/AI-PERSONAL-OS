import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in px-4">
          <EmptyState
            icon={AlertTriangle}
            title="Something went wrong"
            description={this.state.error?.message || "An unexpected error occurred in the application."}
            action={
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-surface border border-white/[0.1] text-foreground text-sm font-semibold hover:bg-surface-700 transition-colors mt-2 flex items-center gap-2"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
