import { useEffect, useState, useMemo } from 'react'
import { AlertTriangle, Search, X, FileText, Target, Ruler, ChevronDown, ChevronRight } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { WorkspaceMode } from '../types/workspaceTypes'

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

  if (!isExpanded) return null

  const q = search.trim().toLowerCase()

  // ── Filtered data ────────────────────────────────────────────────────────────
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
    return sorted.filter(b =>
      String(b.balloonNumber).includes(q) || String(b.pageNumber).includes(q)
    )
  }, [balloons, q])

  const filteredFeatures = useMemo(() => {
    const sorted = [...features].sort((a, b) => a.featureNumber - b.featureNumber)
    if (!q) return sorted
    return sorted.filter(f =>
      String(f.featureNumber).includes(q) ||
      String(f.balloonNumber).includes(q) ||
      f.type.toLowerCase().includes(q) ||
      (f.nominal || '').toLowerCase().includes(q)
    )
  }, [features, q])

  const balloonMap = useMemo(() => new Map(balloons.map(b => [b.id, b])), [balloons])

  const totalResults = filteredPages.length + filteredBalloons.length + filteredFeatures.length
  const showPages = workspaceMode === 'review' || workspaceMode === 'ballooning'
  const showBalloons = workspaceMode === 'ballooning' || workspaceMode === 'features'
  const showFeatures = workspaceMode === 'features'

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

      {/* Balloons */}
      {showBalloons && <NavSubHeader
        icon={Target} label="Balloons" count={balloons.length}
        open={open.balloons} onToggle={() => toggle('balloons')}
      />}
      {showBalloons && open.balloons && (
        <ul className="pb-1">
          {balloons.length === 0 && (
            <li className="px-3 py-1.5 text-[10px] text-gray-600 italic">No balloons placed yet</li>
          )}
          {filteredBalloons.length === 0 && balloons.length > 0 && (
            <li className="px-3 py-1.5 text-[10px] text-gray-600 italic">No balloons match</li>
          )}
          {filteredBalloons.map(balloon => (
            <li key={balloon.id}>
              <button
                onClick={() => {
                  onGoToPage(balloon.pageNumber)
                  onSelectBalloon(balloon.id)
                }}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left',
                  balloon.id === selectedBalloonId
                    ? 'bg-primary/15 text-primary-light font-semibold'
                    : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                ].join(' ')}
              >
                <span className={[
                  'inline-flex items-center justify-center w-4.5 h-4.5 w-5 h-5 rounded-full text-[9px] font-bold shrink-0',
                  balloon.id === selectedBalloonId
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-gray-300',
                ].join(' ')}>
                  {balloon.balloonNumber}
                </span>
                <span>Balloon {balloon.balloonNumber}</span>
                <span className="ml-auto text-[9px] text-gray-600 tabular-nums shrink-0">
                  p.{balloon.pageNumber}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Features */}
      {showFeatures && <NavSubHeader
        icon={Ruler} label="Features" count={features.length}
        open={open.features} onToggle={() => toggle('features')}
      />}
      {showFeatures && open.features && (
        <ul className="pb-1">
          {features.length === 0 && (
            <li className="px-3 py-1.5 text-[10px] text-gray-600 italic">No features added yet</li>
          )}
          {filteredFeatures.length === 0 && features.length > 0 && (
            <li className="px-3 py-1.5 text-[10px] text-gray-600 italic">No features match</li>
          )}
          {filteredFeatures.map(feature => {
            const balloon = balloonMap.get(feature.balloonId)
            const hasValidLink = !!balloon &&
              balloon.balloonNumber === feature.balloonNumber &&
              (feature.pageNumber === undefined || feature.pageNumber === balloon.pageNumber)
            const isLinked = hasValidLink && balloon.id === selectedBalloonId
            return (
              <li key={feature.id}>
                <button
                  onClick={() => {
                    if (hasValidLink) {
                      onGoToPage(balloon.pageNumber)
                      onSelectBalloon(balloon.id)
                    }
                  }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left',
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
