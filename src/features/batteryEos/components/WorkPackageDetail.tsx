import { useState } from 'react'
import {
  X, Package, Flag, BookOpen, CheckSquare, ListTodo,
  Shield, FileText, ExternalLink, ChevronRight, History, Clock,
} from 'lucide-react'
import type { EosWorkPackage, EosStory, EosMilestone, EosStoryState, EosRoleAccess } from '../types/eos.types'
import {
  EOS_STORY_STATUS_LABELS,
  EOS_STORY_STATUS_COLORS,
  EOS_PRIORITY_COLORS,
  EOS_WP_STATUS_LABELS,
  EOS_WP_STATUS_COLORS,
} from '../types/eos.types'
import { StoryCard } from './StoryCard'
import { StoryLifecyclePanel } from './StoryLifecyclePanel'
import { AssignmentPanel } from './AssignmentPanel'
import { StoryEvidencePanel } from './StoryEvidencePanel'
import { ActivityTimeline } from './ActivityTimeline'

type Tab = 'overview' | 'milestones' | 'stories' | 'kanban' | 'documents'

type KanbanGroup = 'active' | 'attention' | 'done' | 'closed'

interface KanbanColumn {
  status: EosStory['status']
  label:  string
  group:  KanbanGroup
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: 'planned',                label: 'Planned',         group: 'active'    },
  { status: 'assigned',               label: 'Assigned',        group: 'active'    },
  { status: 'in_development',         label: 'In Development',  group: 'active'    },
  { status: 'ready_for_verification', label: 'Ready for QA',    group: 'active'    },
  { status: 'verification',           label: 'Verification',    group: 'active'    },
  { status: 'technical_review',       label: 'Tech Review',     group: 'active'    },
  { status: 'blocked',                label: 'Blocked',         group: 'attention' },
  { status: 'rework_required',        label: 'Rework Required', group: 'attention' },
  { status: 'approved',               label: 'Approved',        group: 'done'      },
  { status: 'released',               label: 'Released',        group: 'done'      },
  { status: 'cancelled',              label: 'Cancelled',       group: 'closed'    },
]

const KANBAN_GROUPS: { id: KanbanGroup; label: string; headerCls: string; cardCls: string }[] = [
  { id: 'active',    label: 'In Progress', headerCls: 'bg-blue-50 text-blue-700 border-blue-200',     cardCls: '' },
  { id: 'attention', label: 'Needs Attention', headerCls: 'bg-amber-50 text-amber-700 border-amber-200', cardCls: 'border-amber-200 bg-amber-50/30' },
  { id: 'done',      label: 'Done',        headerCls: 'bg-green-50 text-green-700 border-green-200',   cardCls: 'border-green-200 bg-green-50/30' },
  { id: 'closed',    label: 'Closed',      headerCls: 'bg-gray-100 text-gray-500 border-gray-200',     cardCls: 'border-gray-200 bg-gray-50/50 opacity-60' },
]

// ─── Story Detail Panel ───────────────────────────────────────────────────────

type StoryDetailTab = 'lifecycle' | 'definition' | 'tests' | 'evidence' | 'history'

interface StoryDetailPanelProps {
  story:       EosStory
  storyState:  EosStoryState | null
  access:      EosRoleAccess
  onClose:     () => void
  onStateChange?: (next: EosStoryState) => void
}

function StoryDetailPanel({ story, storyState, access, onClose, onStateChange }: StoryDetailPanelProps) {
  const [tab, setTab] = useState<StoryDetailTab>('lifecycle')

  const effectiveStatus = storyState?.status ?? story.status

  const DETAIL_TABS: { id: StoryDetailTab; label: string; icon: React.ComponentType<{className?:string}> }[] = [
    { id: 'lifecycle',  label: 'Status',      icon: Clock       },
    { id: 'definition', label: 'Definition',  icon: BookOpen    },
    { id: 'tests',      label: 'Tests',       icon: ListTodo    },
    { id: 'evidence',   label: 'Evidence',    icon: FileText    },
    { id: 'history',    label: 'History',     icon: History     },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0 border-b border-border bg-gray-50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded">
                {story.storyId}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${EOS_STORY_STATUS_COLORS[effectiveStatus]}`}>
                {EOS_STORY_STATUS_LABELS[effectiveStatus]}
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_PRIORITY_COLORS[story.priority]}`}>
                {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
              </span>
            </div>
            <h2 className="text-base font-bold text-text-primary leading-snug pb-3">{story.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0 mt-0.5">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-0 overflow-x-auto border-b border-border bg-gray-50 px-5">
          {DETAIL_TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Effort bar — always visible */}
          <div className="flex items-center gap-4 text-xs font-mono text-text-secondary bg-gray-50 rounded-xl px-4 py-2.5 border border-border">
            <span>Engineering: <strong className="text-text-primary">{story.engineeringHours}h</strong></span>
            <span>QA: <strong className="text-text-primary">{story.qaHours}h</strong></span>
            <span>Review: <strong className="text-text-primary">{story.reviewHours}h</strong></span>
            {story.dueDate && (
              <span>Due: <strong className="text-text-primary">
                {new Date(story.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </strong></span>
            )}
          </div>

          {/* ── Lifecycle tab ──────────────────────────────────────────────── */}
          {tab === 'lifecycle' && (
            <>
              {/* Assignments first — manager assigns before triggering CTA */}
              <AssignmentPanel
                storyId={story.storyId}
                workPackageId={story.workPackageId}
                productKey="battery_pm"
                storyState={storyState}
                access={access}
              />

              <div className="border-t border-border" />

              <Section icon={Clock} title="Lifecycle Status">
                <StoryLifecyclePanel
                  storyId={story.storyId}
                  workPackageId={story.workPackageId}
                  productKey="battery_pm"
                  storyState={storyState}
                  access={access}
                  onTransitioned={onStateChange}
                />
              </Section>
            </>
          )}

          {/* ── Definition tab ─────────────────────────────────────────────── */}
          {tab === 'definition' && (
            <>
              <Section icon={BookOpen} title="User Story">
                <p className="text-sm text-text-secondary italic leading-relaxed">"{story.userStory}"</p>
              </Section>

              <Section icon={FileText} title="Description">
                <p className="text-sm text-text-secondary leading-relaxed">{story.description}</p>
              </Section>

              <Section icon={CheckSquare} title="Acceptance Criteria">
                <ul className="flex flex-col gap-1.5">
                  {story.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={Flag} title="Definition of Done">
                <ul className="flex flex-col gap-1.5">
                  {story.definitionOfDone.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 text-success">☐</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </Section>

              {story.useCases?.length > 0 && (
                <Section icon={BookOpen} title="Use Cases">
                  <ul className="flex flex-col gap-1.5">
                    {story.useCases.map((u, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {story.negativeUseCases?.length > 0 && (
                <Section icon={Shield} title="Negative Use Cases">
                  <ul className="flex flex-col gap-1.5">
                    {story.negativeUseCases.map((u, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {/* ── Tests tab ──────────────────────────────────────────────────── */}
          {tab === 'tests' && (
            <>
              <Section icon={ListTodo} title={`Test Cases (${story.testCases.length})`}>
                <div className="flex flex-col gap-2">
                  {story.testCases.map(tc => (
                    <div key={tc.id} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold text-text-primary mb-1">{tc.id} — {tc.title}</p>
                      <div className="text-xs text-text-secondary space-y-0.5">
                        {tc.steps.map((s, i) => <p key={i}>Step {i + 1}: {s}</p>)}
                        <p className="font-medium text-text-primary mt-1">Expected: {tc.expected}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={Shield} title={`Security Test Cases (${story.securityTestCases.length})`}>
                <div className="flex flex-col gap-2">
                  {story.securityTestCases.map(tc => (
                    <div key={tc.id} className="rounded-lg border border-red-200 bg-red-50/30 p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">{tc.id} — {tc.title}</p>
                      <div className="text-xs text-text-secondary space-y-0.5">
                        {tc.steps.map((s, i) => <p key={i}>Step {i + 1}: {s}</p>)}
                        <p className="font-medium text-text-primary mt-1">Expected: {tc.expected}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── Evidence tab ───────────────────────────────────────────────── */}
          {tab === 'evidence' && (
            <StoryEvidencePanel
              storyId={story.storyId}
              workPackageId={story.workPackageId}
              productKey="battery_pm"
              storyState={storyState}
              canEdit={access.isEngineer || access.isManager}
            />
          )}

          {/* ── History tab ────────────────────────────────────────────────── */}
          {tab === 'history' && (
            <Section icon={History} title="Activity Timeline">
              <ActivityTimeline history={storyState?.statusHistory ?? []} />
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{className?:string}>; title: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  wp:           EosWorkPackage
  storyStates?: Record<string, EosStoryState>
  access?:      EosRoleAccess
  onClose:      () => void
}

const DEFAULT_ACCESS: EosRoleAccess = {
  canInfo: true, canDemo: true, canEngineering: false,
  isEngineer: false, isReviewer: false, isManager: false, isQA: false, canInviteNew: false,
}

export function WorkPackageDetail({ wp, storyStates = {}, access = DEFAULT_ACCESS, onClose }: Props) {
  const [tab,           setTab]           = useState<Tab>('overview')
  const [selectedStory, setSelectedStory] = useState<EosStory | null>(null)
  const [localStates,   setLocalStates]   = useState<Record<string, EosStoryState>>({})

  // Merge prop states with locally-optimistic-updated states
  const effectiveStates: Record<string, EosStoryState> = { ...storyStates, ...localStates }

  function handleStateChange(next: EosStoryState) {
    setLocalStates(prev => ({ ...prev, [next.storyId]: next }))
  }

  // Resolve effective status for a story (Firestore > seed default)
  function effectiveStatus(s: EosStory): EosStory['status'] {
    return effectiveStates[s.storyId]?.status ?? s.status
  }

  // Stories with effective status injected (for tabs that need it)
  const resolvedStories = wp.stories.map(s => ({
    ...s,
    status: effectiveStatus(s),
  }))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',    label: 'Overview'                         },
    { id: 'milestones',  label: 'Milestones'                       },
    { id: 'stories',     label: `Stories (${wp.stories.length})`   },
    { id: 'kanban',      label: 'Kanban'                           },
    { id: 'documents',   label: 'Documents'                        },
  ]

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
              <Package className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-mono font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded shrink-0">
                {wp.workPackageId}
              </span>
              <span className="text-sm font-bold text-text-primary truncate">{wp.title}</span>
              <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${EOS_WP_STATUS_COLORS[wp.status]}`}>
                {EOS_WP_STATUS_LABELS[wp.status]}
              </span>
            </div>
            <div className="text-xs text-text-secondary shrink-0 hidden sm:block">{wp.missionName}</div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 -mb-px overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {tab === 'overview' && <OverviewTab wp={wp} resolvedStories={resolvedStories} />}
          {tab === 'milestones' && (
            <MilestonesTab milestones={wp.milestones} stories={resolvedStories} />
          )}
          {tab === 'stories' && (
            <StoriesTab
              stories={resolvedStories}
              onSelectStory={s => {
                const orig = wp.stories.find(x => x.storyId === s.storyId) ?? s
                setSelectedStory(orig)
              }}
            />
          )}
          {tab === 'kanban' && (
            <KanbanTab
              stories={resolvedStories}
              onSelectStory={s => {
                const orig = wp.stories.find(x => x.storyId === s.storyId) ?? s
                setSelectedStory(orig)
              }}
            />
          )}
          {tab === 'documents' && (
            <DocumentsTab wp={wp} storyStates={effectiveStates} />
          )}
        </div>
      </div>

      {selectedStory && (
        <StoryDetailPanel
          story={selectedStory}
          storyState={effectiveStates[selectedStory.storyId] ?? null}
          access={access}
          onClose={() => setSelectedStory(null)}
          onStateChange={handleStateChange}
        />
      )}
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function OverviewTab({ wp, resolvedStories }: { wp: EosWorkPackage; resolvedStories: EosStory[] }) {
  const approvedCount = resolvedStories.filter(s => s.status === 'approved' || s.status === 'released').length
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="card p-5">
        <h3 className="text-sm font-bold text-text-primary mb-3">Mission</h3>
        <p className="text-sm text-text-secondary">{wp.missionName}</p>
        <p className="text-sm text-text-primary font-medium mt-2">{wp.definition}</p>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-bold text-text-primary mb-3">Scope</h3>
        <div className="flex flex-wrap gap-2">
          {wp.scope.map((s, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-text-secondary border border-border">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-bold text-text-primary mb-3">Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Milestones" value={wp.milestones.length} />
          <StatBox label="Stories"    value={wp.stories.length} />
          <StatBox label="Approved"   value={approvedCount} />
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Overall Progress</span>
            <span>{wp.stories.length > 0 ? Math.round((approvedCount / wp.stories.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${wp.stories.length > 0 ? Math.round((approvedCount / wp.stories.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3 text-center">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function MilestonesTab({ milestones, stories }: { milestones: EosMilestone[]; stories: EosStory[] }) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {milestones.map(m => (
        <div key={m.milestoneId} className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold text-text-primary">{m.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">{m.description}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
              m.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200'
              : m.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200'
              : m.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {m.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.storyIds.map(sid => {
              const s = stories.find(st => st.storyId === sid)
              return s ? (
                <span key={sid} className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${EOS_STORY_STATUS_COLORS[s.status]}`}>
                  {sid}
                </span>
              ) : null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function StoriesTab({ stories, onSelectStory }: { stories: EosStory[]; onSelectStory: (s: EosStory) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map(s => (
        <StoryCard key={s.storyId} story={s} onClick={() => onSelectStory(s)} />
      ))}
    </div>
  )
}

function KanbanTab({ stories, onSelectStory }: { stories: EosStory[]; onSelectStory: (s: EosStory) => void }) {
  return (
    <div className="flex flex-col gap-5 pb-4">
      {KANBAN_GROUPS.map(group => {
        const groupCols = KANBAN_COLUMNS.filter(c => c.group === group.id)
        const groupTotal = groupCols.reduce((n, c) => n + stories.filter(s => s.status === c.status).length, 0)
        return (
          <div key={group.id}>
            {/* Group header */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 w-fit ${group.headerCls}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">{group.label}</span>
              <span className="text-[10px] font-bold opacity-70">({groupTotal})</span>
            </div>

            {/* Columns row */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {groupCols.map(col => {
                const colStories = stories.filter(s => s.status === col.status)
                return (
                  <div key={col.status} className="min-w-[190px] flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-xs font-semibold text-text-secondary">{col.label}</span>
                      <span className="text-[10px] font-bold text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {colStories.length}
                      </span>
                    </div>
                    {colStories.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center">
                        <p className="text-[10px] text-text-secondary/40">Empty</p>
                      </div>
                    ) : (
                      colStories.map(s => (
                        <div
                          key={s.storyId}
                          onClick={() => onSelectStory(s)}
                          className={`rounded-xl border p-3 cursor-pointer hover:shadow-sm transition-all ${group.cardCls || 'border-border bg-white hover:border-primary/30'}`}
                        >
                          <p className="text-[10px] font-mono text-text-secondary mb-1">{s.storyId}</p>
                          <p className="text-xs font-semibold text-text-primary line-clamp-2">{s.title}</p>
                          <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${EOS_PRIORITY_COLORS[s.priority]}`}>
                            {s.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DocumentsTab({
  wp,
  storyStates,
}: {
  wp: EosWorkPackage
  storyStates: Record<string, EosStoryState>
}) {
  const links: { label: string; href: string }[] = []

  for (const s of wp.stories) {
    const ev = storyStates[s.storyId]?.evidence
    if (ev?.googleDriveFolder) links.push({ label: `${s.storyId} — Google Drive`,        href: ev.googleDriveFolder  })
    if (ev?.architectureDoc)   links.push({ label: `${s.storyId} — Architecture Doc`,    href: ev.architectureDoc    })
    if (ev?.designDoc)         links.push({ label: `${s.storyId} — Design Doc`,          href: ev.designDoc          })
    if (ev?.pullRequest)       links.push({ label: `${s.storyId} — Pull Request`,        href: ev.pullRequest        })
    if (ev?.verificationReport)links.push({ label: `${s.storyId} — Verification Report`, href: ev.verificationReport })
    if (ev?.securityReport)    links.push({ label: `${s.storyId} — Security Report`,     href: ev.securityReport     })
    if (ev?.demoVideo)         links.push({ label: `${s.storyId} — Demo Video`,          href: ev.demoVideo          })
    if (ev?.presentation)      links.push({ label: `${s.storyId} — Presentation`,        href: ev.presentation       })
    // Fall back to seed data links
    if (!ev) {
      if (s.googleDriveFolderLink) links.push({ label: `${s.storyId} — Google Drive`, href: s.googleDriveFolderLink })
      if (s.pullRequestUrl)        links.push({ label: `${s.storyId} — Pull Request`, href: s.pullRequestUrl })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="card p-5">
        <p className="text-sm font-semibold text-text-primary mb-3">Engineering Documents</p>
        <p className="text-xs text-text-secondary mb-4">
          All large artefacts live in Google Drive. Add links in each story's Evidence tab.
        </p>
        <div className="flex flex-col gap-2">
          {links.map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" />
              {item.label}
            </a>
          ))}
          {links.length === 0 && (
            <p className="text-xs text-text-secondary italic">
              No documents linked yet. Open a story → Evidence tab to add links.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
