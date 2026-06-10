import { Target, Trash2, Info } from 'lucide-react'
import { SidebarActionButton, SidebarActionCard } from './SidebarActionCard'

interface BalloonToolsSectionProps {
  isExpanded: boolean
  isWorkflowBallooning: boolean
  isBalloonMode: boolean
  hasSelectedBalloon: boolean
  balloonCount: number
  onToggleBalloonMode: () => void
  onDeleteSelectedBalloon: () => void
}

export function BalloonToolsSection({
  isExpanded,
  isWorkflowBallooning,
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
      <SidebarActionCard
        icon={Target}
        onClick={onToggleBalloonMode}
        disabled={!isWorkflowBallooning}
        title={isBalloonMode ? 'Ballooning Active' : 'Enable Ballooning'}
        description={isBalloonMode
          ? 'Click anywhere on drawing to place a balloon'
          : isWorkflowBallooning
            ? 'Click to start placing balloons'
            : 'Select Ballooning workflow first'}
        titleText={isBalloonMode ? 'Click to exit balloon mode' : 'Click drawing to place a balloon'}
        tone={isBalloonMode ? 'green' : 'neutral'}
        active={isBalloonMode}
        trailing={isBalloonMode ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(74_222_128)] animate-pulse shrink-0" />
        ) : undefined}
      />

      {/* Stats row */}
      {balloonCount > 0 && (
        <div className="flex items-center gap-1.5 px-1 py-1">
          <span className="text-[10px] text-gray-600">{balloonCount} balloon{balloonCount !== 1 ? 's' : ''} placed</span>
        </div>
      )}

      {/* Contextual: delete selected */}
      {hasSelectedBalloon ? (
        <SidebarActionButton
          icon={Trash2}
          onClick={onDeleteSelectedBalloon}
          label="Delete Selected Balloon"
          tone="danger"
          title="Delete the currently selected balloon and its linked feature"
        />
      ) : (
        <div className="flex items-center gap-1.5 px-1 py-0.5">
          <Info className="w-3 h-3 text-gray-600 shrink-0" />
          <span className="text-[10px] text-gray-600">Select a balloon to delete it</span>
        </div>
      )}
    </div>
  )
}
