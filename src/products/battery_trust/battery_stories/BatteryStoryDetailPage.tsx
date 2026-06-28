import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  ClipboardList,
  Database,
  Lock,
  MonitorCheck,
  FlaskConical,
  Camera,
  BadgeCheck,
} from 'lucide-react'
import { useBranding } from '../../../hooks/useBranding'
import { UserAvatarMenu } from '../../../components/ui/UserAvatarMenu'
import { BATTERY_TRUST_PRODUCT } from '../productConfig'
import { STORY_SLUG_MAP, getStory } from './storyCatalogue'
import type { StoryStatus, StoryPriority } from './storyCatalogue'
import { useBatteryTrustTheme } from '../useBatteryTrustTheme'
import { BatteryTrustThemeToggle } from '../BatteryTrustThemeToggle'

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab =
  | 'overview'
  | 'requirements'
  | 'architecture'
  | 'use_cases'
  | 'test_cases'
  | 'security_tests'
  | 'verification'
  | 'demo_evidence'

interface TabDef {
  id:    Tab
  label: string
  icon:  React.ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { id: 'overview',       label: 'Overview',       icon: Layers        },
  { id: 'requirements',   label: 'Requirements',   icon: ClipboardList },
  { id: 'architecture',   label: 'Architecture',   icon: Database      },
  { id: 'use_cases',      label: 'Use Cases',      icon: CheckCircle2  },
  { id: 'test_cases',     label: 'Test Cases',     icon: FlaskConical  },
  { id: 'security_tests', label: 'Security Tests', icon: Shield        },
  { id: 'verification',   label: 'Verification',   icon: MonitorCheck  },
  { id: 'demo_evidence',  label: 'Demo Evidence',  icon: Camera        },
]

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function statusBadge(status: StoryStatus, isDark: boolean) {
  const dark: Record<StoryStatus, [string, string]> = {
    planned:     ['Planned',     'bg-slate-800 text-slate-400 border-slate-600'],
    in_progress: ['In Progress', 'bg-blue-900/50 text-blue-300 border-blue-700/50'],
    review:      ['In Review',   'bg-amber-900/40 text-amber-300 border-amber-700/40'],
    done:        ['Done',        'bg-emerald-900/40 text-emerald-400 border-emerald-700/40'],
  }
  const light: Record<StoryStatus, [string, string]> = {
    planned:     ['Planned',     'bg-background text-text-secondary border-border'],
    in_progress: ['In Progress', 'bg-blue-50 text-blue-700 border-blue-200'],
    review:      ['In Review',   'bg-amber-50 text-amber-700 border-amber-200'],
    done:        ['Done',        'bg-emerald-50 text-emerald-700 border-emerald-200'],
  }
  const [label, cls] = (isDark ? dark : light)[status]
  return { label, cls }
}

function priorityBadge(priority: StoryPriority, isDark: boolean) {
  const dark: Record<StoryPriority, [string, string]> = {
    critical: ['Critical', 'bg-red-900/40 text-red-400 border-red-700/40'],
    high:     ['High',     'bg-orange-900/40 text-orange-400 border-orange-700/40'],
    medium:   ['Medium',   'bg-yellow-900/30 text-yellow-400 border-yellow-700/40'],
    low:      ['Low',      'bg-slate-800 text-slate-400 border-slate-600'],
  }
  const light: Record<StoryPriority, [string, string]> = {
    critical: ['Critical', 'bg-red-50 text-red-700 border-red-200'],
    high:     ['High',     'bg-orange-50 text-orange-700 border-orange-200'],
    medium:   ['Medium',   'bg-yellow-50 text-yellow-700 border-yellow-200'],
    low:      ['Low',      'bg-background text-text-secondary border-border'],
  }
  const [label, cls] = (isDark ? dark : light)[priority]
  return { label, cls }
}

// ─── List section component ───────────────────────────────────────────────────

function ListSection({ title, items, icon: Icon, iconColor = 'text-blue-400', bullet = 'dot', txt2, txt3 }: {
  title:       string
  items:       string[]
  icon:        React.ComponentType<{ className?: string }>
  iconColor?:  string
  bullet?:     'dot' | 'check' | 'x' | 'shield' | 'number'
  txt2:        string
  txt3:        string
}) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-bold" style={{ color: 'inherit' }}>{title}</h3>
        <span className={`text-[10px] ml-1 ${txt3}`}>{items.length}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            {bullet === 'check'  && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
            {bullet === 'x'      && <XCircle      className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
            {bullet === 'shield' && <Shield       className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
            {bullet === 'number' && <span className={`text-[10px] font-bold w-5 text-right shrink-0 mt-0.5 ${txt3}`}>{i + 1}.</span>}
            {bullet === 'dot'    && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0 mt-1.5" />}
            <p className={`text-xs leading-relaxed ${txt2}`}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BatteryStoryDetailPage() {
  const { slug }     = useParams<{ slug: string }>()
  const { branding } = useBranding()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { isDark, toggle } = useBatteryTrustTheme()

  const storyId = slug ? STORY_SLUG_MAP[slug] : undefined
  const story   = storyId ? getStory(storyId) : undefined

  if (!story) return <Navigate to={BATTERY_TRUST_PRODUCT.wpRoute} replace />

  const sBadge = statusBadge(story.status, isDark)
  const pBadge = priorityBadge(story.priority, isDark)

  // ── Theme shortcuts ──────────────────────────────────────────────────────
  const d = isDark
  const pageStyle  = d ? { background: '#020817' } : undefined
  const pageClass  = d ? 'min-h-screen flex flex-col' : 'min-h-screen flex flex-col bg-background'
  const hdrClass   = d ? 'border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40'
                       : 'bg-white border-b border-border sticky top-0 z-40'
  const logoTxt    = d ? 'text-slate-400 group-hover:text-blue-400 transition-colors text-xs'
                       : 'text-text-secondary group-hover:text-primary transition-colors text-xs'
  const chevron    = d ? 'w-3 h-3 text-slate-700 shrink-0' : 'w-3 h-3 text-border shrink-0'
  const crumbLink  = d ? 'text-slate-400 hover:text-blue-400 transition-colors truncate hidden md:block text-xs'
                       : 'text-text-secondary hover:text-primary transition-colors truncate hidden md:block text-xs'
  const pageTitle  = d ? 'text-xs font-bold text-white truncate' : 'text-xs font-bold text-text-primary truncate'
  const secIco     = d ? 'w-3.5 h-3.5 text-blue-400 shrink-0' : 'w-3.5 h-3.5 text-primary shrink-0'
  const backLink   = d ? 'inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors w-fit'
                       : 'inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors w-fit'
  const hdrCard    = d ? 'bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6'
                       : 'bg-white border border-border rounded-2xl p-5 sm:p-6'
  const hdrIconBg  = d ? 'w-12 h-12 rounded-xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0'
                       : 'w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0'
  const monoTag    = d ? 'text-xs font-bold font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-700/30'
                       : 'text-xs font-bold font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded border border-primary/20'
  const pts        = d ? 'text-[10px] text-slate-500 ml-auto' : 'text-[10px] text-text-secondary ml-auto'
  const h1Cls      = d ? 'text-xl sm:text-2xl font-extrabold text-white mb-2' : 'text-xl sm:text-2xl font-extrabold text-text-primary mb-2'
  const accCls     = d ? 'text-blue-400' : 'text-primary'
  const txt2       = d ? 'text-slate-400' : 'text-text-secondary'
  const txt3       = d ? 'text-slate-500' : 'text-text-secondary/70'
  const divider    = d ? 'border-slate-700/50' : 'border-border'
  const metaCls    = d ? 'text-slate-500' : 'text-text-secondary'
  const metaVal    = d ? 'text-slate-400' : 'text-text-primary'
  const tabBorder  = d ? 'border-b border-slate-800' : 'border-b border-border'
  const tabActive  = d ? 'border-blue-500 text-blue-400' : 'border-primary text-primary'
  const tabInactive = d ? 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
  const card       = d ? 'bg-slate-900 border border-slate-700/60 rounded-xl p-5'
                       : 'bg-white border border-border rounded-xl p-5'
  const lbl        = d ? 'text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1'
                       : 'text-[10px] text-text-secondary uppercase font-semibold tracking-wider mb-1'
  const bodyTxt    = d ? 'text-sm text-slate-300 leading-relaxed' : 'text-sm text-text-primary leading-relaxed'
  const quoteText  = d ? 'text-sm text-blue-300 leading-relaxed italic' : 'text-sm text-primary leading-relaxed italic'
  const dblDivider = d ? 'mt-6 pt-5 border-t border-slate-700/50' : 'mt-6 pt-5 border-t border-border'
  const headingCls = d ? 'text-white' : 'text-text-primary'
  const evidBox    = d ? 'mt-5 pt-4 border-t border-slate-700/50 border-l-2 border-l-amber-600 rounded-r-lg bg-amber-950/20 p-3'
                       : 'mt-5 pt-4 border-t border-border border-l-2 border-l-amber-500 rounded-r-lg bg-amber-50 p-3'
  const evidLbl    = d ? 'text-[10px] text-amber-400 font-semibold mb-1' : 'text-[10px] text-amber-700 font-semibold mb-1'
  const evidMono   = d ? 'text-[10px] text-slate-500 font-mono' : 'text-[10px] text-text-secondary font-mono'

  const lsi = { txt2, txt3 }
  const accIco = d ? 'text-blue-400' : 'text-primary'

  return (
    <div className={pageClass} style={pageStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={hdrClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-1.5 min-w-0 text-sm">
              <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 shrink-0 group">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-xs">F</span>
                </div>
                <span className={logoTxt}>{branding.businessName}</span>
              </Link>
              <ChevronRight className={`${chevron} hidden sm:block`} />
              <Link to={BATTERY_TRUST_PRODUCT.routeBase} className={crumbLink}>Battery Trust</Link>
              <ChevronRight className={`${chevron} hidden md:block`} />
              <Link to={BATTERY_TRUST_PRODUCT.wpRoute} className={crumbLink}>WP-001</Link>
              <ChevronRight className={chevron} />
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className={secIco} />
                <span className={pageTitle}>{story.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BatteryTrustThemeToggle isDark={isDark} onToggle={toggle} />
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link to={BATTERY_TRUST_PRODUCT.wpRoute} className={backLink}>
          <ArrowLeft className="w-3.5 h-3.5" />
          WP-001 — {BATTERY_TRUST_PRODUCT.workPackageTitle}
        </Link>

        {/* ── Story header ───────────────────────────────────────────────────── */}
        <div className={hdrCard}>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className={hdrIconBg}>
              <ShieldCheck className={`w-6 h-6 ${accCls}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={monoTag}>{story.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pBadge.cls}`}>{pBadge.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sBadge.cls}`}>{sBadge.label}</span>
                <span className={pts}>{story.storyPoints} story points</span>
              </div>
              <h1 className={h1Cls}>{story.title}</h1>
              <p className={`text-xs leading-relaxed max-w-2xl ${txt2}`}>
                <span className={`font-semibold ${accCls}`}>Mission relevance: </span>
                {story.missionRelevance}
              </p>
            </div>
          </div>
          <div className={`mt-4 pt-4 border-t ${divider} flex items-center gap-4 flex-wrap text-xs ${metaCls}`}>
            <span>Owner: <span className={metaVal}>{story.owner}</span></span>
            <span>WP: <span className={metaVal}>{BATTERY_TRUST_PRODUCT.workPackageId}</span></span>
            <span>Product: <span className={metaVal}>{BATTERY_TRUST_PRODUCT.productName}</span></span>
          </div>
        </div>

        {/* ── Tab navigation ─────────────────────────────────────────────────── */}
        <div className={`flex items-center gap-0.5 ${tabBorder} overflow-x-auto pb-px scrollbar-hide`}>
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 -mb-px ${
                  activeTab === tab.id ? tabActive : tabInactive
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ────────────────────────────────────────────────────── */}
        <div className={`flex flex-col gap-6 pb-12 ${headingCls}`}>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${card} flex flex-col gap-4`}>
                <div>
                  <p className={lbl}>Business Goal</p>
                  <p className={bodyTxt}>{story.businessGoal}</p>
                </div>
                <div>
                  <p className={lbl}>Problem Statement</p>
                  <p className={bodyTxt}>{story.problemStatement}</p>
                </div>
              </div>
              <div className={`${card} flex flex-col gap-4`}>
                <div>
                  <p className={lbl}>User Persona</p>
                  <p className={bodyTxt}>{story.userPersona}</p>
                </div>
                <div>
                  <p className={lbl}>User Story</p>
                  <p className={quoteText}>"{story.userStory}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {activeTab === 'requirements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <ListSection title="Functional Requirements" items={story.functionalRequirements}
                  icon={ClipboardList} iconColor={accIco} bullet="number" {...lsi} />
              </div>
              <div className="flex flex-col gap-5">
                <div className={card}>
                  <ListSection title="Non-Functional Requirements" items={story.nonFunctionalRequirements}
                    icon={Layers} iconColor={accIco} bullet="dot" {...lsi} />
                </div>
                <div className={card}>
                  <ListSection title="UI Requirements" items={story.uiRequirements}
                    icon={MonitorCheck} iconColor={accIco} bullet="dot" {...lsi} />
                </div>
              </div>
            </div>
          )}

          {/* Architecture */}
          {activeTab === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <ListSection title="Backend Requirements" items={story.backendRequirements}
                  icon={Database} iconColor={accIco} bullet="number" {...lsi} />
              </div>
              <div className={card}>
                <ListSection title="Data Model" items={story.dataModel}
                  icon={Layers} iconColor={d ? 'text-emerald-400' : 'text-emerald-600'} bullet="dot" {...lsi} />
              </div>
            </div>
          )}

          {/* Use Cases */}
          {activeTab === 'use_cases' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <ListSection title="Use Cases" items={story.useCases}
                  icon={CheckCircle2} iconColor={d ? 'text-emerald-400' : 'text-emerald-600'} bullet="check" {...lsi} />
              </div>
              <div className={card}>
                <ListSection title="Negative Use Cases" items={story.negativeUseCases}
                  icon={XCircle} iconColor="text-red-400" bullet="x" {...lsi} />
              </div>
            </div>
          )}

          {/* Test Cases */}
          {activeTab === 'test_cases' && (
            <div className={card}>
              <ListSection title="Acceptance Criteria" items={story.acceptanceCriteria}
                icon={BadgeCheck} iconColor={d ? 'text-emerald-400' : 'text-emerald-600'} bullet="check" {...lsi} />
            </div>
          )}

          {/* Security Tests */}
          {activeTab === 'security_tests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <ListSection title="Security Requirements" items={story.securityRequirements}
                  icon={Lock} iconColor="text-red-400" bullet="shield" {...lsi} />
              </div>
              <div className={card}>
                <ListSection title="Security Test Cases" items={story.securityTestCases}
                  icon={Shield} iconColor={accIco} bullet="number" {...lsi} />
              </div>
            </div>
          )}

          {/* Verification */}
          {activeTab === 'verification' && (
            <div className={card}>
              <ListSection title="Manual Verification Steps" items={story.manualVerificationSteps}
                icon={MonitorCheck} iconColor={accIco} bullet="number" {...lsi} />
              <div className={dblDivider}>
                <ListSection title="Definition of Done" items={story.definitionOfDone}
                  icon={BadgeCheck} iconColor={d ? 'text-emerald-400' : 'text-emerald-600'} bullet="check" {...lsi} />
              </div>
            </div>
          )}

          {/* Demo Evidence */}
          {activeTab === 'demo_evidence' && (
            <div className={card}>
              <ListSection title="Demo Evidence Required" items={story.demoEvidenceRequired}
                icon={Camera} iconColor={d ? 'text-amber-400' : 'text-amber-600'} bullet="number" {...lsi} />
              <div className={evidBox}>
                <p className={evidLbl}>Evidence Naming Convention</p>
                <p className={evidMono}>{story.id}_{'<evidenceType>_<YYYYMMDD>.<ext>'}</p>
                <p className={`${evidMono} mt-1`}>Example: {story.id}_score_dashboard_20260628.png</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
