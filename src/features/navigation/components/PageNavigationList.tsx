import { FileText } from 'lucide-react'

interface PageNavigationListProps {
  numPages: number
  currentPage: number
  onGoToPage: (page: number) => void
}

export function PageNavigationList({ numPages, currentPage, onGoToPage }: PageNavigationListProps) {
  if (numPages === 0) {
    return <p className="px-4 py-2 text-xs text-text-secondary italic">No pages loaded</p>
  }

  return (
    <ul>
      {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
        <li key={page}>
          <button
            onClick={() => onGoToPage(page)}
            className={[
              'w-full flex items-center gap-3 px-4 py-1.5 text-xs transition-colors text-left',
              page === currentPage
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-text-secondary hover:bg-gray-50',
            ].join(' ')}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Page {page}</span>
            {page === currentPage && (
              <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                Current
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
