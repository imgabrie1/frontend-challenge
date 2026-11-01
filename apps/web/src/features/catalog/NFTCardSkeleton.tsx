import { Skeleton } from '@/components/ui/skeleton'

export function NFTCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col"
      aria-hidden="true"
    >
      <div className="aspect-square bg-muted">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}
