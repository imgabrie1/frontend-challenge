import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-8xl font-black text-primary/40 tracking-tighter mb-2">404</span>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Button asChild>
        <Link to="/">
          <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Marketplace
        </Link>
      </Button>
    </div>
  )
}
