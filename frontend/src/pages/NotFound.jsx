import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found"
        description="The page you are looking for doesn't exist or has been moved."
        action={
          <Link
            to="/chat"
            className="px-5 py-2.5 rounded-xl bg-brand-500 text-foreground text-sm font-semibold hover:bg-brand-400 transition-colors mt-2"
          >
            Go to Home
          </Link>
        }
      />
    </div>
  )
}
