import { useEffect, useState } from 'react'
import { subscribeToWatermark, WATERMARK_DEFAULTS, type WatermarkConfig } from '../../services/watermarkService'

interface BetaWatermarkProps {
  // Hint from the calling page: 'dark' = dark background (e.g. PDF workspace)
  // Used to resolve config.variant === 'auto'. Defaults to 'light'.
  pageVariant?: 'light' | 'dark'
}

export function BetaWatermark({ pageVariant = 'light' }: BetaWatermarkProps) {
  const [config, setConfig] = useState<WatermarkConfig>(WATERMARK_DEFAULTS)

  useEffect(() => {
    return subscribeToWatermark(setConfig)
  }, [])

  if (!config.enabled) return null

  // Resolve the effective variant
  const effectiveVariant = config.variant === 'auto' ? pageVariant : config.variant

  // Use inline style for dynamic opacity rather than Tailwind opacity classes
  const color = effectiveVariant === 'dark'
    ? `rgba(255, 255, 255, ${config.opacity})`
    : `rgba(17, 24, 39, ${config.opacity})`

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          className="text-[64px] sm:text-[88px] lg:text-[112px] font-black tracking-widest uppercase whitespace-nowrap -rotate-[35deg] origin-center"
          style={{ color }}
        >
          {config.text}
        </span>
      </div>
    </div>
  )
}
