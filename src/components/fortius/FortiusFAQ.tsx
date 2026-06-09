import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { trackFortiusFAQExpand } from '../../services/AnalyticsService'

export interface FAQItem {
  q: string
  a: string
}

export function FortiusFAQ({ faqs, className = '' }: { faqs: FAQItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null)

  function toggle(i: number, q: string) {
    if (open !== i) trackFortiusFAQExpand(q)
    setOpen(open === i ? null : i)
  }

  return (
    <div className={`divide-y divide-border rounded-xl border border-border overflow-hidden ${className}`}>
      {faqs.map(({ q, a }, i) => (
        <div key={i} className="bg-white">
          <button
            onClick={() => toggle(i, q)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-background transition-colors"
            aria-expanded={open === i}
          >
            <span className="font-semibold text-text-primary pr-4 text-sm sm:text-base">{q}</span>
            <ChevronDown
              className={`w-5 h-5 text-text-secondary shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-4">
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
