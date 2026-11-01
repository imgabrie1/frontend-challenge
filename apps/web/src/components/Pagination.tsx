import { ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <nav className="flex items-center justify-end gap-1.5 mt-10" aria-label="Pagination Navigation">
      {getPages().map((p, idx) =>
        typeof p === 'number' ? (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold transition-colors cursor-pointer ${
              p === page
                ? 'bg-[#d67926] text-[#140d07]'
                : 'bg-[#1c130b] text-foreground border border-border/80 hover:border-primary hover:text-primary'
            }`}
          >
            {p}
          </button>
        ) : (
          <span key={`dots-${idx}`} className="px-1 text-muted-foreground select-none text-xs" aria-hidden>
            ...
          </span>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold bg-[#1c130b] text-foreground border border-border/80 hover:border-primary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </nav>
  )
}
