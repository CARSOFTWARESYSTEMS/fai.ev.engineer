interface BetaWatermarkProps {
  variant?: 'light' | 'dark'
}

export function BetaWatermark({ variant = 'light' }: BetaWatermarkProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          className={[
            'text-[64px] sm:text-[88px] lg:text-[112px] font-black tracking-widest uppercase whitespace-nowrap',
            '-rotate-[35deg] origin-center',
            variant === 'dark' ? 'text-white/[0.05]' : 'text-gray-900/[0.04]',
          ].join(' ')}
        >
          FAI AS9102 BETA TESTING
        </span>
      </div>
    </div>
  )
}
