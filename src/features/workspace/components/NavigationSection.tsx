import { useEffect, useRef, useState, useMemo } from 'react'
import { AlertTriangle, Search, X, FileText, Target, Ruler, ChevronDown, ChevronRight } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import type { WorkspaceMode } from '../types/workspaceTypes'

const LIST_MAX_HEIGHT = 300  // px — max before scrolling kicks in
const ROW_HEIGHT = 32        // estimated px per row

interface NavigationSectionProps {
  isExpanded: boolean
  numPages: number
  currentPage: number
  onGoToPage: (page: number) => void
  balloons: Balloon[]
  selectedBalloonId: string | null
  onSelectBalloon: (id: string) => void
  features: Feature[]
  projectName: string
  workspaceMode: WorkspaceMode
  statusByBalloonId?: ReadonlyMap<string, Form3Status>
}

function NavSubHeader({
  icon: Icon, label, count, open, onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] transition-colors group"
    >
      <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-400 shrink-0" />
      <span className="flex-1 text-left text-[10px] font-semibold text-gray-500 group-hover:text-gray-400 transition-colors">
        {label}
      </span>
      {count > 0 && (
        <span className="text-[9px] font-bold bg-white/[0.06] text-gray-500 rounded px-1.5 py-0.5 tabular-nums shrink-0">
          {count}
        </span>
      )}
      {open
        ? <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
        : <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
      }
    </button>
  )
}

function StatusDot({ status }: { status: Form3Status | undefined }) {
  if (!status || status === 'pending') return null
  return (
    <span className={[
      'w-1.5 h-1.5 rounded-full shrink-0',
      status === 'pass' ? 'bg-green-400' : 'bg-red-400',
    ].join(' ')} />
  )
}

export function NavigationSection({
  isExpanded,
  numPages,
  currentPage,
  onGoToPage,
  balloons,
  selectedBalloonId,
  onSelectBalloon,
  features,
  workspaceMode,
  statusByBalloonId,
}: NavigationSectionProps) {
  const [open, setOpen] = useState({ pages: true, balloons: true, features: false })
  const [search, setSearch] = useState('')
  const toggle = (k: keyof typeof open) => setOpen(p => ({ ...p, [k]: !p[k] }))

  useEffect(() => {
    setOpen({
      pages: workspaceMode === 'review' || workspaceMode === 'ballooning',
      balloons: workspaceMode === 'ballooning' || workspaceMode === 'features',
      features: workspaceMode === 'features',
    })
    setSearch('')
  }, [workspaceMode])

  const q = search.trim().toLowerCase()

  const filteredPages = useMemo(() => {
    if (!q) return Array.from({ length: numPages }, (_, i) => i + 1)
    const n = parseInt(q, 10)
    return isNaN(n)
      ? Array.from({ length: numPages }, (_, i) => i + 1)
      : Array.from({ length: numPages }, (_, i) => i + 1).filter(p => String(p).includes(q))
  }, [numPages, q])

  const filteredBalloons = useMemo(() => {
    const sorted = [...balloons].sort((a, b) => a.balloonNumber - b.balloonNumber)
    if (!q) return sorted
    return sorted.filter(b => {
      if (String(b.balloonNumber).includes(q) || String(b.pageNumber).includes(q)) return true
      const status = statusByBalloonId?.get(b.id)
      if (status && status.includes(q)) return true
      return false
    })
  }, [balloons, q, statusByBalloonId])

  const filteredFeatures = useMemo(() => {
    const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)
    if (!q) return sorted
    return sorted.filter(f =>
      String(f.featureNumber).includes(q) ||
      String(f.balloonNumber).includes(q) ||
      f.type.toLowerCase().includes(q) ||
      (f.nominal || '').toLowerCase().includes(q),
    )
  }, [features, q])

  const balloonMap = useMemo(() => new Map(balloons.map(b => [b.id, b])), [balloons])

  // ── Virtual lists ────────────────────────────────────────────────────────────
  const balloonListRef = useRef<HTMLDivElement>(null)
  const featureListRef = useRef<HTMLDivElement>(null)

  const balloonVirtualizer = useVirtualizer({
    count: filteredBalloons.length,
    getScrollElement: () => balloonListRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  const featureVirtualizer = useVirtualizer({
    count: filteredFeatures.length,
    getScrollElement: () => featureListRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  // Scroll the balloon list to show the currently selected balloon
  const selectedBalloonVirtualIdx = useMemo(
    () => filteredBalloons.findIndex(b => b.id === selectedBalloonId),
    [filteredBalloons, selectedBalloonId],
  )

  useEffect(() => {
    if (selectedBalloonVirtualIdx >= 0 && open.balloons) {
      balloonVirtualizer.scrollToIndex(selectedBalloonVirtualIdx, { align: 'auto' })
    }
  }, [selectedBalloonId, open.balloons])

  if (!isExpanded) return null

  const totalResults = filteredPages.length + filteredBalloons.length + filteredFeatures.length
  const showPages = workspaceMode === 'review' || workspaceMode === 'ballooning'
  const showBalloons = workspaceMode === 'ballooning' || workspaceMode === 'features'
  const showFeatures = workspaceMode === 'features'

  const balloonListHeight = Math.min(
    LIST_MAX_HEIGHT,
    filteredBalloons.length * ROW_HEIGHT + 4,
  )
  const featureListHeight = Math.min(
    LIST_MAX_HEIGHT,
    filteredFeatures.length * ROW_HEIGHT + 4,
  )

  return (
    <div>
      {/* Search box */}
      <div className="px-3 pb-2">
        <div className={[
          'flex items-center gap-1.5 bg-white/[0.05] rounded-lg px-2.5 py-1.5',
          'border border-white/[0.08] focus-within:border-primary/40 transition-colors',
        ].join(' ')}>
          <Search className="w-3 h-3 text-gray-600 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search balloons, features…"
            className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {q && (
          <p className="text-[9px] text-gray-600 mt-1 px-0.5">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
            {q && <span className="ml-1 italic">for "{q}"</span>}
          </p>
        )}
      </div>

      {/* Pages */}
      {showPages && <NavSubHeader
        icon={FileText} label="Pages" count={numPages}
        open={open.pages} onToggle={() => toggle('pages')}
      />}
      {showPages && open.pages && (
        <ul className="pb-1">
          {filteredPages.length === 0 && (
            <li className="px-3 py-1.5 text-[10px] text-gray-600 italic">No pages match</li>
          )}
          {filteredPages.map(page => (
            <li key={page}>
              <button
                onClick={() => onGoToPage(page)}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left',
                  page === currentPage
                    ? 'bg-primary/15 text-primary-light font-semibold'
                    : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                ].join(' ')}
              >
                <FileText className="w-3 h-3 shrink-0 opacity-50" />
                <span>Page {page}</span>
                {page === currentPage && (
                  <span className="ml-auto text-[9px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Balloons — virtualized */}
      {showBalloons && <NavSubHeader
        icon={Target} label="Balloons" count={balloons.length}
        open={open.balloons} onToggle={() => toggle('balloons')}
      />}
      {showBalloons && open.balloons && (
        <>
          {balloons.length === 0 && (
            <p className="px-3 py-1.5 text-[10px] text-gray-600 italic">No balloons placed yet</p>
          )}
          {filteredBalloons.length === 0 && balloons.length > 0 && (
            <p className="px-3 py-1.5 text-[10px] text-gray-600 italic">No balloons match</p>
          )}
          {filteredBalloons.length > 0 && (
            <div
              ref={balloonListRef}
              style={{ height: balloonListHeight, overflowY: 'auto' }}
              className="scrollbar-thin scrollbar-thumb-white/10 pb-1"
            >
              <div style={{ height: balloonVirtualizer.getTotalSize(), position: 'relative' }}>
                {balloonVirtualizer.getVirtualItems().map(vRow => {
                  const balloon = filteredBalloons[vRow.index]
                  const status = statusByBalloonId?.get(balloon.id)
                  const isActive = balloon.id === selectedBalloonId
                  return (
                    <div
                      key={balloon.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: vRow.size,
                        transform: `translateY(${vRow.start}px)`,
                      }}
                    >
                      <button
                        onClick={() => {
                          onGoToPage(balloon.pageNumber)
                          onSelectBalloon(balloon.id)
                        }}
                        className={[
                          'w-full h-full flex items-center gap-2.5 px-3 text-xs transition-colors text-left',
                          isActive
                            ? 'bg-primary/15 text-primary-light font-semibold'
                            : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                        ].join(' ')}
                      >
                        <span className={[
                          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0',
                          isActive ? 'bg-primary text-white' : 'bg-white/10 text-gray-300',
                        ].join(' ')}>
                          {balloon.balloonNumber}
                        </span>
                        <span>Balloon {balloon.balloonNumber}</span>
                        <div className="ml-auto flex items-center gap-1.5 shrink-0">
                          <StatusDot status={status} />
                          <span className="text-[9px] text-gray-600 tabular-nums">
                            p.{balloon.pageNumber}
                          </span>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Features — virtualized */}
      {showFeatures && <NavSubHeader
        icon={Ruler} label="Features" count={features.length}
        open={open.features} onToggle={() => toggle('features')}
      />}
      {showFeatures && open.features && (
        <>
          {features.length === 0 && (
            <p className="px-3 py-1.5 text-[10px] text-gray-600 italic">No features added yet</p>
          )}
          {filteredFeatures.length === 0 && features.length > 0 && (
            <p className="px-3 py-1.5 text-[10px] text-gray-600 italic">No features match</p>
          )}
          {filteredFeatures.length > 0 && (
            <div
              ref={featureListRef}
              style={{ height: featureListHeight, overflowY: 'auto' }}
              className="scrollbar-thin scrollbar-thumb-white/10 pb-1"
            >
              <div style={{ height: featureVirtualizer.getTotalSize(), position: 'relative' }}>
                {featureVirtualizer.getVirtualItems().map(vRow => {
                  const feature = filteredFeatures[vRow.index]
                  const balloon = balloonMap.get(feature.balloonId)
                  const hasValidLink = !!balloon &&
                    balloon.balloonNumber === feature.balloonNumber &&
                    (feature.pageNumber === undefined || feature.pageNumber === balloon.pageNumber)
                  const isLinked = hasValidLink && balloon.id === selectedBalloonId
                  return (
                    <div
                      key={feature.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: vRow.size,
                        transform: `translateY(${vRow.start}px)`,
                      }}
                    >
                      <button
                        onClick={() => {
                          if (hasValidLink) {
                            onGoToPage(balloon.pageNumber)
                            onSelectBalloon(balloon.id)
                          }
                        }}
                        className={[
                          'w-full h-full flex items-center gap-2 px-3 text-xs transition-colors text-left',
                          isLinked
                            ? 'bg-primary/15 text-primary-light font-semibold'
                            : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                        ].join(' ')}
                      >
                        <span className="text-[9px] font-bold text-gray-600 bg-white/[0.06] rounded px-1 py-0.5 shrink-0 tabular-nums">
                          F{feature.featureNumber}
                        </span>
                        <span className="truncate flex-1">{feature.type}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasValidLink ? (
                            <span className={[
                              'inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold shrink-0',
                              isLinked ? 'bg-primary text-white' : 'bg-white/10 text-gray-400',
                            ].join(' ')}>
                              {feature.balloonNumber}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-amber-500">
                              <AlertTriangle className="h-3 w-3" />
                              Unlinked
                            </span>
                          )}
                          {hasValidLink && (
                            <span className="text-[9px] text-gray-600 tabular-nums">
                              p.{balloon.pageNumber}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
