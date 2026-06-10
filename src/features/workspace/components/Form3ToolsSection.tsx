import { ClipboardList } from 'lucide-react'

interface Form3ToolsSectionProps {
  isExpanded: boolean
  isForm3Open: boolean
  onToggleForm3: () => void
}

export function Form3ToolsSection({
  isExpanded,
  isForm3Open,
  onToggleForm3,
}: Form3ToolsSectionProps) {
  if (!isExpanded) return null

  return (
    <div className="px-2 space-y-0.5">
      <button
        onClick={onToggleForm3}
        title={isForm3Open ? 'Close AS9102 Form 3' : 'Open AS9102 Form 3 inspection report'}
        className={[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs w-full transition-colors font-medium',
          isForm3Open
            ? 'bg-primary/20 text-primary-light ring-1 ring-primary/40'
            : 'text-gray-300 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
        <span>{isForm3Open ? 'Close Form 3' : 'Open Form 3'}</span>
      </button>
      <p className="px-2.5 text-[10px] text-gray-600 leading-relaxed">
        AS9102D First Article Inspection
      </p>
    </div>
  )
}
