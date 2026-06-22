import { ShieldX } from 'lucide-react'

interface Props {
  reason: string
}

export function ReadOnlyBanner({ reason }: Props) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 rounded-xl
      bg-amber-50 border border-amber-200 text-sm text-amber-800">
      <ShieldX className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="font-semibold">This organisation is currently read-only</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Reason: {reason} · Contact your Partner Administrator to restore access.
        </p>
      </div>
    </div>
  )
}
