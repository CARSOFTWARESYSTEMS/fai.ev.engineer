import type { Balloon } from '../../ballooning/types/balloonTypes'

interface BalloonNavigationListProps {
  balloons: Balloon[]
  selectedBalloonId: string | null
  onSelectBalloon: (balloon: Balloon) => void
}

export function BalloonNavigationList({
  balloons,
  selectedBalloonId,
  onSelectBalloon,
}: BalloonNavigationListProps) {
  if (balloons.length === 0) {
    return <p className="px-4 py-2 text-xs text-text-secondary italic">No balloons placed</p>
  }

  const sorted = [...balloons].sort((a, b) => a.balloonNumber - b.balloonNumber)

  return (
    <ul>
      {sorted.map(balloon => (
        <li key={balloon.id}>
          <button
            onClick={() => onSelectBalloon(balloon)}
            className={[
              'w-full flex items-center gap-3 px-4 py-1.5 text-xs transition-colors text-left',
              balloon.id === selectedBalloonId
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-text-secondary hover:bg-gray-50',
            ].join(' ')}
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">
              {balloon.balloonNumber}
            </span>
            <span>Balloon {balloon.balloonNumber}</span>
            <span className="ml-auto text-[10px] text-text-secondary shrink-0 tabular-nums">
              p.{balloon.pageNumber}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
