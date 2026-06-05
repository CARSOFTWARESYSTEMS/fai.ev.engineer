import { useState } from 'react'
import { X, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature } from '../../featureTable/types/featureTypes'
import { PageNavigationList } from './PageNavigationList'
import { BalloonNavigationList } from './BalloonNavigationList'
import { FeatureNavigationList } from './FeatureNavigationList'
import { ExportActions } from './ExportActions'

interface SmartSidebarProps {
  isOpen: boolean
  onClose: () => void
  numPages: number
  currentPage: number
  onGoToPage: (page: number) => void
  balloons: Balloon[]
  selectedBalloonId: string | null
  onSelectBalloon: (id: string) => void
  features: Feature[]
  projectName: string
}

interface SectionProps {
  title: string
  count?: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ title, count, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] bg-gray-100 text-text-secondary rounded-full px-1.5 py-0.5 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
        }
      </button>
      {expanded && <div className="pb-1">{children}</div>}
    </div>
  )
}

export function SmartSidebar({
  isOpen,
  onClose,
  numPages,
  currentPage,
  onGoToPage,
  balloons,
  selectedBalloonId,
  onSelectBalloon,
  features,
  projectName,
}: SmartSidebarProps) {
  const [expanded, setExpanded] = useState({
    pages: true,
    balloons: true,
    features: true,
    export: true,
  })

  const toggle = (key: keyof typeof expanded) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const handleBalloonClick = (balloon: Balloon) => {
    onGoToPage(balloon.pageNumber)
    onSelectBalloon(balloon.id)
  }

  const handleFeatureClick = (feature: Feature) => {
    const balloon = balloons.find(b => b.id === feature.balloonId)
    if (balloon) {
      onGoToPage(balloon.pageNumber)
      onSelectBalloon(balloon.id)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-black/30 z-40 transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={[
          'fixed right-0 top-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50',
          'flex flex-col transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Navigator</span>
          </div>
          <button
            onClick={onClose}
            title="Close navigator"
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <Section
            title="Pages"
            count={numPages}
            expanded={expanded.pages}
            onToggle={() => toggle('pages')}
          >
            <PageNavigationList
              numPages={numPages}
              currentPage={currentPage}
              onGoToPage={onGoToPage}
            />
          </Section>

          <Section
            title="Balloons"
            count={balloons.length}
            expanded={expanded.balloons}
            onToggle={() => toggle('balloons')}
          >
            <BalloonNavigationList
              balloons={balloons}
              selectedBalloonId={selectedBalloonId}
              onSelectBalloon={handleBalloonClick}
            />
          </Section>

          <Section
            title="Features"
            count={features.length}
            expanded={expanded.features}
            onToggle={() => toggle('features')}
          >
            <FeatureNavigationList
              features={features}
              balloons={balloons}
              selectedBalloonId={selectedBalloonId}
              onSelectFeature={handleFeatureClick}
            />
          </Section>

          <Section
            title="Export"
            expanded={expanded.export}
            onToggle={() => toggle('export')}
          >
            <ExportActions
              features={features}
              balloons={balloons}
              projectName={projectName}
            />
          </Section>
        </div>
      </div>
    </>
  )
}
