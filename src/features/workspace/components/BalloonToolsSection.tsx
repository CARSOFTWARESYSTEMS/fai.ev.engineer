import { Target, Trash2, Info } from 'lucide-react'

interface BalloonToolsSectionProps {
  isExpanded: boolean
  isBalloonMode: boolean
  hasSelectedBalloon: boolean
  balloonCount: number
  onToggleBalloonMode: () => void
  onDeleteSelectedBalloon: () => void
}

export function BalloonToolsSection({
  isExpanded,
  isBalloonMode,
  hasSelectedBalloon,
  balloonCount,
  onToggleBalloonMode,
  onDeleteSelectedBalloon,
}: BalloonToolsSectionProps) {
  if (!isExpanded) return null

  return (
    <div className="px-3 space-y-1">
      {/* Mode toggle */}
      <button
        onClick={onToggleBalloonMode}
        title={isBalloonMode ? 'Click to exit balloon mode' : 'Click drawing to place a balloon'}
        className={[
          'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all',
          isBalloonMode
            ? 'bg-primary/20 text-primary-light ring-1 ring-primary/40 shadow-sm'
            : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]',
        ].join(' ')}
      >
        <div className={[
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
          isBalloonMode ? 'bg-primary/30' : 'bg-white/10',
        ].join(' ')}>
          <Target className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 text-left">
          <div>{isBalloonMode ? 'Ballooning Active' : 'Enable Ballooning'}</div>
          {isBalloonMode && (
            <div className="text-[9px] font-normal text-primary-light/70 mt-0.5">
              Click on drawing to place
            </div>
          )}
        </div>
        {isBalloonMode && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse shrink-0" />
        )}
      </button>

      {/* Stats row */}
      {balloonCount > 0 && (
        <div className="flex items-center gap-1.5 px-1 py-1">
          <span className="text-[10px] text-gray-600">{balloonCount} balloon{balloonCount !== 1 ? 's' : ''} placed</span>
        </div>
      )}

      {/* Contextual: delete selected */}
      {hasSelectedBalloon ? (
        <button
          onClick={onDeleteSelectedBalloon}
          title="Delete the currently selected balloon and its linked feature"
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          <span>Delete Selected Balloon</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-1 py-0.5">
          <Info className="w-3 h-3 text-gray-600 shrink-0" />
          <span className="text-[10px] text-gray-600">Select a balloon to delete it</span>
        </div>
      )}
    </div>
  )
}
