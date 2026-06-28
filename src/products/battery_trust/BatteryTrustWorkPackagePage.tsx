import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react'
import { useBranding } from '../../hooks/useBranding'
import { UserAvatarMenu } from '../../components/ui/UserAvatarMenu'
import {
  BATTERY_TRUST_PRODUCT,
  TRUST_SCORE_COMPONENTS,
  READINESS_BANDS,
  HARD_FAIL_GATES,
} from './productConfig'
import { ALL_STORIES, STORY_ROUTE_MAP } from './battery_stories/storyCatalogue'
import type { StoryStatus, StoryPriority } from './battery_stories/storyCatalogue'
import { useBatteryTrustTheme } from './useBatteryTrustTheme'
import { BatteryTrustThemeToggle } from './BatteryTrustThemeToggle'

// ─── Status / Priority badges ─────────────────────────────────────────────────

function storyStatusBadge(status: StoryStatus, isDark: boolean): string {
  if (isDark) {
    return {
      planned:     'bg-slate-800 text-slate-400 border-slate-600',
      in_progress: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
      review:      'bg-amber-900/40 text-amber-300 border-amber-700/40',
      done:        'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    }[status]
  }
  return {
    planned:     'bg-background text-text-secondary border-border',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    review:      'bg-amber-50 text-amber-700 border-amber-200',
    done:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[status]
}

function storyStatusLabel(status: StoryStatus): string {
  return { planned: 'Planned', in_progress: 'In Progress', review: 'In Review', done: 'Done' }[status]
}

function storyPriorityBadge(priority: StoryPriority, isDark: boolean): string {
  if (isDark) {
    return {
      critical: 'bg-red-900/40 text-red-400 border-red-700/40',
      high:     'bg-orange-900/40 text-orange-400 border-orange-700/40',
      medium:   'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
      low:      'bg-slate-800 text-slate-400 border-slate-600',
    }[priority]
  }
  return {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high:     'bg-orange-50 text-orange-700 border-orange-200',
    medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    low:      'bg-background text-text-secondary border-border',
  }[priority]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BatteryTrustWorkPackagePage() {
  const { branding } = useBranding()
  const { isDark, toggle } = useBatteryTrustTheme()

  // ── Theme shortcuts ──────────────────────────────────────────────────────
  const d = isDark
  const pageStyle   = d ? { background: '#020817' } : undefined
  const pageClass   = d ? 'min-h-screen flex flex-col' : 'min-h-screen flex flex-col bg-background'
  const hdrClass    = d ? 'border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40'
                        : 'bg-white border-b border-border sticky top-0 z-40'
  const logoTxt     = d ? 'hidden sm:block text-sm text-slate-400 group-hover:text-blue-400 transition-colors'
                        : 'hidden sm:block text-sm text-text-secondary group-hover:text-primary transition-colors'
  const chevron     = d ? 'w-3.5 h-3.5 text-slate-700 shrink-0' : 'w-3.5 h-3.5 text-border shrink-0'
  const crumbLink   = d ? 'text-sm text-slate-400 hover:text-blue-400 transition-colors truncate hidden sm:block'
                        : 'text-sm text-text-secondary hover:text-primary transition-colors truncate hidden sm:block'
  const pageTitle   = d ? 'text-sm font-bold text-white truncate' : 'text-sm font-bold text-text-primary truncate'
  const secIco      = d ? 'w-4 h-4 text-blue-400' : 'w-4 h-4 text-primary'
  const backLink    = d ? 'inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors w-fit'
                        : 'inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors w-fit'
  const card        = d ? 'bg-slate-900 border border-slate-700/60 rounded-xl p-5'
                        : 'bg-white border border-border rounded-xl p-5'
  const txt2        = d ? 'text-slate-400' : 'text-text-secondary'
  const txt3        = d ? 'text-slate-500' : 'text-text-secondary/70'
  const accCls      = d ? 'text-blue-400' : 'text-primary'
  const divider     = d ? 'border-slate-700/50' : 'border-border'
  const barTrack    = d ? 'bg-slate-700' : 'bg-border/80'
  const barFill     = d ? 'bg-blue-500' : 'bg-primary'
  const secTitle    = d ? 'text-sm font-bold text-white' : 'text-sm font-bold text-text-primary'
  const noticeHd    = d ? 'text-sm font-semibold text-blue-300 mb-1' : 'text-sm font-semibold text-primary mb-1'
  const noticeBd    = d ? 'text-xs text-slate-400 leading-relaxed' : 'text-xs text-text-secondary leading-relaxed'
  const notice      = d ? 'bg-blue-950/20 border border-blue-800/20 rounded-xl p-5 flex items-start gap-4'
                        : 'bg-primary-light border border-primary/10 rounded-xl p-5 flex items-start gap-4'
  const wpCardCls   = d ? 'bg-slate-900 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-600/50 transition-all duration-150'
                        : 'bg-white border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all duration-150'
  const monoTag     = d ? 'text-[10px] font-bold font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-700/30'
                        : 'text-[10px] font-bold font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded border border-primary/20'
  const storyTitle  = d ? 'text-sm font-bold text-white leading-snug group-hover:text-blue-300 transition-colors'
                        : 'text-sm font-bold text-text-primary leading-snug group-hover:text-primary transition-colors'
  const storyPts    = d ? 'text-[10px] text-slate-500' : 'text-[10px] text-text-secondary'
  const storyOpen   = d ? 'inline-flex items-center gap-1 text-[10px] text-blue-400 group-hover:gap-1.5 transition-all'
                        : 'inline-flex items-center gap-1 text-[10px] text-primary group-hover:gap-1.5 transition-all'
  const heroStyle   = d ? { background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3a 100%)' } : undefined
  const heroBorder  = d ? 'relative rounded-2xl border border-slate-700/60 overflow-hidden'
                        : 'relative rounded-2xl border border-border overflow-hidden bg-white'
  const heroH1      = d ? 'text-2xl sm:text-3xl font-extrabold text-white mb-3'
                        : 'text-2xl sm:text-3xl font-extrabold text-text-primary mb-3'
  const heroSubBadge = d ? 'text-xs font-bold font-mono text-blue-400' : 'text-xs font-bold font-mono text-primary'
  const heroActiveBadge = d ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                            : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'
  const heroIconBg  = d ? 'w-14 h-14 rounded-2xl bg-blue-900/60 border border-blue-700/40 flex items-center justify-center shrink-0'
                        : 'w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0'
  const heroIco     = d ? 'w-7 h-7 text-blue-400' : 'w-7 h-7 text-primary'

  // Section badges
  const sectionBadge = d
    ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-700/40 ml-1'
    : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20 ml-1'
  const hardFailCard = d
    ? 'bg-slate-900 border border-red-900/30 rounded-xl p-5'
    : 'bg-white border border-red-200 rounded-xl p-5'
  const hardFailBadge = d
    ? 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/40 ml-auto'
    : 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 ml-auto'
  const hardFailDesc = d ? 'text-[10px] text-slate-500 mb-3' : 'text-[10px] text-text-secondary mb-3'

  return (
    <div className={pageClass} style={pageStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={hdrClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className={logoTxt}>{branding.businessName}</span>
              </Link>
              <ChevronRight className={chevron} />
              <Link to={BATTERY_TRUST_PRODUCT.routeBase} className={crumbLink}>
                Battery Trust
              </Link>
              <ChevronRight className={chevron} />
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className={secIco} />
                <span className={pageTitle}>{BATTERY_TRUST_PRODUCT.workPackageId}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BatteryTrustThemeToggle isDark={isDark} onToggle={toggle} />
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">

        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link to={BATTERY_TRUST_PRODUCT.routeBase} className={backLink}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Battery Trust Platform
        </Link>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className={heroBorder} style={heroStyle}>
          {d && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />}
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className={heroIconBg}>
                <ShieldCheck className={heroIco} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={heroSubBadge}>{BATTERY_TRUST_PRODUCT.workPackageId}</span>
                  <span className={heroActiveBadge}>ACTIVE</span>
                </div>
                <h1 className={heroH1}>{BATTERY_TRUST_PRODUCT.workPackageTitle}</h1>
                <p className={`text-sm font-semibold mb-3 italic ${accCls}`}>
                  "Can this battery be trusted for this mission, right now?"
                </p>
                <p className={`text-sm leading-relaxed max-w-2xl ${txt2}`}>
                  {BATTERY_TRUST_PRODUCT.mission}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column body ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: score model + bands + gates */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            {/* Score model */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className={secIco} />
                <h2 className={secTitle}>Trust Score Model</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {TRUST_SCORE_COMPONENTS.map(comp => (
                  <div key={comp.label} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${txt2}`}>{comp.label}</p>
                    </div>
                    <div className={`shrink-0 w-12 h-1.5 rounded-full overflow-hidden ${barTrack}`}>
                      <div className={`h-full rounded-full ${barFill}`} style={{ width: `${(comp.weight / 20) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-bold w-8 text-right shrink-0 ${accCls}`}>
                      {comp.weight}%
                    </span>
                  </div>
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${divider} flex justify-between text-[10px] ${txt3}`}>
                <span>Total</span>
                <span className={`font-bold ${txt2}`}>
                  {TRUST_SCORE_COMPONENTS.reduce((s, c) => s + c.weight, 0)}%
                </span>
              </div>
            </div>

            {/* Readiness bands */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className={secIco} />
                <h2 className={secTitle}>Readiness Bands</h2>
              </div>
              <div className="flex flex-col gap-2">
                {READINESS_BANDS.map(band => (
                  <div
                    key={band.label}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 border ${band.bg} ${band.border}`}
                  >
                    <p className={`text-xs font-bold ${band.color}`}>{band.label}</p>
                    <span className={`text-xs font-mono font-bold ${band.color}`}>
                      {band.min}–{band.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard-fail gates */}
            <div className={hardFailCard}>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4 text-red-400" />
                <h2 className={secTitle}>Hard-Fail Gates</h2>
                <span className={hardFailBadge}>{HARD_FAIL_GATES.length}</span>
              </div>
              <p className={hardFailDesc}>
                Any active gate overrides the score to 0 and GROUNDS the battery.
              </p>
              <div className="flex flex-col gap-1.5">
                {HARD_FAIL_GATES.map(gate => (
                  <div key={gate} className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <span className={`text-xs ${txt2}`}>{gate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: story cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className={secIco} />
              <h2 className={secTitle}>User Stories</h2>
              <span className={sectionBadge}>{ALL_STORIES.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_STORIES.map(story => {
                const route = STORY_ROUTE_MAP[story.id]
                return (
                  <Link key={story.id} to={route} className={`group ${wpCardCls}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={monoTag}>{story.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${storyPriorityBadge(story.priority, d)}`}>
                          {story.priority}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${storyStatusBadge(story.status, d)}`}>
                        {storyStatusLabel(story.status)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={storyTitle}>{story.title}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={storyPts}>{story.storyPoints} pts</span>
                      <span className={storyOpen}>
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Phase notice ──────────────────────────────────────────────────── */}
        <div className={notice}>
          <Lock className={`w-5 h-5 shrink-0 mt-0.5 ${accCls}`} />
          <div>
            <p className={noticeHd}>Private Work Package — Phase 1: Documentation UI Only</p>
            <p className={noticeBd}>
              This phase delivers the private product card, protected routes, epic work package page, and 10 detailed story pages with access control. Scoring engine, MQTT ingestion, and live telemetry are not implemented yet.
            </p>
          </div>
        </div>

        {/* ── Footer note ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pb-4">
          <AlertTriangle className={`w-4 h-4 ${txt3}`} />
          <p className={`text-xs ${txt3}`}>
            This workspace is restricted. Unauthorised access attempts are logged.
          </p>
        </div>

      </main>
    </div>
  )
}
