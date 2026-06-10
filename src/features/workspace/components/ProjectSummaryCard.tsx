interface ProjectSummaryCardProps {
  numPages: number
  balloonCount: number
  featureCount: number
}

export function ProjectSummaryCard({ numPages, balloonCount, featureCount }: ProjectSummaryCardProps) {
  return (
    <div className="px-3 pt-2 pb-1.5">
      <p className="text-[9px] font-bold tracking-[0.18em] text-gray-500 uppercase mb-1.5">
        Project Summary
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: numPages,      label: 'Pages' },
          { value: balloonCount,  label: 'Balloons' },
          { value: featureCount,  label: 'Features' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/[0.04] border border-white/[0.06] rounded-lg py-1.5 text-center">
            <div className="text-base font-bold text-white tabular-nums leading-none">{value}</div>
            <div className="text-[9px] text-gray-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
