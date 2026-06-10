import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import { AlertTriangle } from 'lucide-react'

interface FeatureNavigationListProps {
  features: Feature[]
  balloons: Balloon[]
  selectedBalloonId: string | null
  onSelectFeature: (feature: Feature) => void
}

export function FeatureNavigationList({
  features,
  balloons,
  selectedBalloonId,
  onSelectFeature,
}: FeatureNavigationListProps) {
  if (features.length === 0) {
    return <p className="px-4 py-2 text-xs text-text-secondary italic">No features added</p>
  }

  const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)
  const balloonMap = new Map(balloons.map(b => [b.id, b]))

  return (
    <ul>
      {sorted.map(feature => {
        const balloon = balloonMap.get(feature.balloonId)
        const hasValidLink = !!balloon &&
          balloon.balloonNumber === feature.balloonNumber &&
          (feature.pageNumber === undefined || feature.pageNumber === balloon.pageNumber)
        const isLinked = hasValidLink && balloon.id === selectedBalloonId

        return (
          <li key={feature.id}>
            <button
              onClick={() => hasValidLink && onSelectFeature(feature)}
              className={[
                'w-full flex items-center gap-3 px-4 py-1.5 text-xs transition-colors text-left',
                isLinked
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-text-secondary hover:bg-gray-50',
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold text-text-secondary bg-gray-100 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
                F{feature.featureNumber}
              </span>
              <span className="truncate">{feature.type}</span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                {hasValidLink ? (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold">
                    {feature.balloonNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Unlinked
                  </span>
                )}
                {hasValidLink && (
                  <span className="text-[10px] text-text-secondary tabular-nums">
                    p.{balloon.pageNumber}
                  </span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
