import { AlertTriangle } from 'lucide-react'

export function SyntheticPocBanner({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>SYNTHETIC POC — NOT FOR OPERATIONAL OR FLIGHT DECISIONS</span>
    </div>
  )
}
