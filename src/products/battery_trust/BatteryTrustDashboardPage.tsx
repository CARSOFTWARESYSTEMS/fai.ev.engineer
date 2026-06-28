import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Lock,
  Activity,
  Cpu,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { useBranding } from '../../hooks/useBranding'
import { useAuth } from '../../auth/hooks/useAuth'
import { UserAvatarMenu } from '../../components/ui/UserAvatarMenu'
import { BATTERY_TRUST_PRODUCT } from './productConfig'
import { useBatteryTrustTheme } from './useBatteryTrustTheme'
import { BatteryTrustThemeToggle } from './BatteryTrustThemeToggle'

// ─── Grid background (dark mode only) ─────────────────────────────────────────

const DARK_GRID: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

// ─── Feature pillars ───────────────────────────────────────────────────────────

interface Pillar {
  icon:  React.ComponentType<{ className?: string }>
  title: string
  desc:  string
}

const PILLARS: Pillar[] = [
  { icon: ShieldCheck, title: 'Identity Trust',       desc: 'Cryptographic battery identity, certificate validation, and chain-of-custody verification.' },
  { icon: Cpu,         title: 'Firmware Integrity',   desc: 'Firmware hash verification and BMS configuration signature validation.' },
  { icon: Activity,    title: 'Telemetry Validation', desc: 'MQTT packet authentication, freshness checks, and anomaly detection.' },
  { icon: Lock,        title: 'Cybersecurity Risk',   desc: 'Replay attack detection, spoofing alerts, and BMS intrusion monitoring.' },
  { icon: Zap,         title: 'Safety Condition',     desc: 'Temperature, voltage, current, and cell imbalance hard-fail gate evaluation.' },
  { icon: AlertTriangle, title: 'Mission Readiness',  desc: 'Composite 0–100 trust score and GO/NO-GO decision engine for mission authorisation.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BatteryTrustDashboardPage() {
  const { branding } = useBranding()
  const { user }     = useAuth()
  const { isDark, toggle } = useBatteryTrustTheme()

  // ── Theme shortcuts ──────────────────────────────────────────────────────
  const d = isDark
  const pageStyle    = d ? { background: '#020817' } : undefined
  const pageClass    = d ? 'min-h-screen flex flex-col' : 'min-h-screen flex flex-col bg-background'
  const hdrClass     = d ? 'border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40'
                         : 'bg-white border-b border-border sticky top-0 z-40'
  const logoTxt      = d ? 'hidden sm:block text-sm text-slate-400 group-hover:text-blue-400 transition-colors'
                         : 'hidden sm:block text-sm text-text-secondary group-hover:text-primary transition-colors'
  const chevron      = d ? 'w-4 h-4 text-slate-700 shrink-0' : 'w-4 h-4 text-border shrink-0'
  const pageTitleCls = d ? 'text-sm font-bold text-white truncate' : 'text-sm font-bold text-text-primary truncate'
  const pvtBadge     = d ? 'hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50'
                         : 'hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200'
  const phaseBadge   = d ? 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/40 tracking-widest'
                         : 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-background text-text-secondary border border-border tracking-widest'
  const h1Cls        = d ? 'text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight'
                         : 'text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 leading-tight'
  const accentCls    = d ? 'text-blue-400' : 'text-primary'
  const bodyTxt      = d ? 'text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mb-6'
                         : 'text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mb-6'
  const missionTxt   = d ? 'text-sm text-slate-500 max-w-xl leading-relaxed mb-8 italic'
                         : 'text-sm text-text-secondary/70 max-w-xl leading-relaxed mb-8 italic'
  const statusTxt    = d ? 'flex items-center gap-2 text-sm text-slate-400' : 'flex items-center gap-2 text-sm text-text-secondary'
  const dotCls       = d ? 'w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0' : 'w-2 h-2 rounded-full bg-primary animate-pulse shrink-0'
  const emailCls     = d ? 'text-slate-300' : 'text-text-primary'
  const statCard     = d ? 'bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center'
                         : 'bg-white border border-border rounded-xl p-4 text-center'
  const statVal      = d ? 'text-2xl font-extrabold text-white' : 'text-2xl font-extrabold text-text-primary'
  const statSub      = d ? 'text-xs text-blue-400 font-semibold' : 'text-xs text-primary font-semibold'
  const statLbl      = d ? 'text-[10px] text-slate-500 mt-0.5' : 'text-[10px] text-text-secondary mt-0.5'
  const secIcon      = d ? 'w-4 h-4 text-blue-400' : 'w-4 h-4 text-primary'
  const secTitle     = d ? 'text-sm font-bold text-white uppercase tracking-wider' : 'text-sm font-bold text-text-primary uppercase tracking-wider'
  const wpCard       = d ? 'group block bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 hover:border-blue-600/50 hover:bg-slate-900/80 transition-all duration-200'
                         : 'group block bg-white border border-border rounded-2xl p-6 sm:p-8 hover:border-primary/20 hover:shadow-sm transition-all duration-200'
  const wpIconBg     = d ? 'w-14 h-14 rounded-2xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0'
                         : 'w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0'
  const wpId         = d ? 'text-xs font-bold text-blue-400 font-mono' : 'text-xs font-bold text-primary font-mono'
  const wpTitle      = d ? 'text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors'
                         : 'text-xl sm:text-2xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors'
  const wpDesc       = d ? 'text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl' : 'text-sm text-text-secondary leading-relaxed mb-4 max-w-2xl'
  const wpMeta       = d ? 'flex items-center gap-1.5 text-xs text-slate-400' : 'flex items-center gap-1.5 text-xs text-text-secondary'
  const wpMetaIco    = d ? 'w-3.5 h-3.5 text-blue-400' : 'w-3.5 h-3.5 text-primary'
  const wpBtn        = d ? 'inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl group-hover:bg-blue-500 transition-colors'
                         : 'inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'
  const pillarCard   = d ? 'bg-slate-900 border border-slate-700/60 rounded-xl p-5 flex flex-col gap-3'
                         : 'bg-white border border-border rounded-xl p-5 flex flex-col gap-3'
  const pillarIcoBg  = d ? 'w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-700/30 flex items-center justify-center'
                         : 'w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center'
  const pillarIco    = d ? 'w-4 h-4 text-blue-400' : 'w-4 h-4 text-primary'
  const pillarTtl    = d ? 'text-sm font-bold text-white mb-1' : 'text-sm font-bold text-text-primary mb-1'
  const pillarDsc    = d ? 'text-xs text-slate-400 leading-relaxed' : 'text-xs text-text-secondary leading-relaxed'
  const banner       = d ? 'bg-blue-950/30 border border-blue-800/30 rounded-2xl p-6 flex items-start gap-4'
                         : 'bg-primary-light border border-primary/20 rounded-2xl p-6 flex items-start gap-4'
  const bannerIcoBg  = d ? 'w-10 h-10 rounded-lg bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0'
                         : 'w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm'
  const bannerIco    = d ? 'w-5 h-5 text-blue-400' : 'w-5 h-5 text-primary'
  const bannerHd     = d ? 'text-sm font-semibold text-blue-300 mb-1' : 'text-sm font-semibold text-primary mb-1'
  const bannerBd     = d ? 'text-xs text-slate-400 leading-relaxed max-w-3xl' : 'text-xs text-text-secondary leading-relaxed max-w-3xl'

  return (
    <div className={pageClass} style={pageStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={hdrClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className={logoTxt}>{branding.businessName}</span>
              </Link>
              <ChevronRight className={chevron} />
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className={secIcon} />
                <span className={pageTitleCls}>Battery Trust Platform</span>
                <span className={pvtBadge}>PRIVATE</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BatteryTrustThemeToggle isDark={isDark} onToggle={toggle} />
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section
          className={`relative overflow-hidden border-b ${d ? 'border-slate-800/60' : 'border-border'}`}
          style={d ? { background: 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0f1f3a 100%)', ...DARK_GRID } : undefined}
        >
          {d && (
            <>
              <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-800/8 rounded-full blur-2xl pointer-events-none" />
            </>
          )}

          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 ${d ? '' : 'bg-white'}`}>
            <div className="flex flex-col lg:flex-row items-start gap-10">

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={d ? 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/40 tracking-widest'
                                     : 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 tracking-widest'}>
                    PRIVATE · RESTRICTED ACCESS
                  </span>
                  <span className={phaseBadge}>PHASE 1 — DOCUMENTATION</span>
                </div>

                <h1 className={h1Cls}>
                  <span className={accentCls}>Battery Trust Platform</span>
                </h1>

                <p className={bodyTxt}>
                  Private engineering workspace for aerospace battery trust, cybersecurity, telemetry validation, and mission readiness scoring.
                </p>

                <p className={missionTxt}>{BATTERY_TRUST_PRODUCT.mission}</p>

                <div className={statusTxt}>
                  <div className={dotCls} />
                  <span>Workspace active · Signed in as <span className={emailCls}>{user?.email}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0 w-full lg:w-auto">
                {[
                  { label: 'Work Packages',  value: '1',  sub: 'Active'    },
                  { label: 'User Stories',   value: '10', sub: 'Planned'   },
                  { label: 'Trust Factors',  value: '7',  sub: 'Scored'    },
                  { label: 'Hard-Fail Gates',value: '11', sub: 'Enforced'  },
                ].map(stat => (
                  <div key={stat.label} className={statCard}>
                    <p className={statVal}>{stat.value}</p>
                    <p className={statSub}>{stat.sub}</p>
                    <p className={statLbl}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Work Package Card ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className={secIcon} />
            <h2 className={secTitle}>Active Work Package</h2>
          </div>

          <Link to={BATTERY_TRUST_PRODUCT.wpRoute} className={wpCard}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className={wpIconBg}>
                <ShieldCheck className={`w-7 h-7 ${d ? 'text-blue-400' : 'text-primary'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={wpId}>{BATTERY_TRUST_PRODUCT.workPackageId}</span>
                  <span className={d ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                                     : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'}>
                    ACTIVE
                  </span>
                </div>

                <h3 className={wpTitle}>{BATTERY_TRUST_PRODUCT.workPackageTitle}</h3>

                <p className={wpDesc}>
                  Build the core scoring engine that determines whether a battery can be trusted for a mission based on identity, firmware integrity, telemetry trust, cybersecurity risk, safety condition, and maintenance evidence.
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  {[
                    { icon: ShieldCheck,   label: '10 stories'       },
                    { icon: Lock,          label: '11 hard-fail gates' },
                    { icon: Activity,      label: '7 trust dimensions' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className={wpMeta}>
                      <Icon className={wpMetaIco} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <span className={wpBtn}>
                  Open Work Package
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Capability pillars ─────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className={secIcon} />
            <h2 className={secTitle}>Platform Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map(pillar => {
              const Icon = pillar.icon
              return (
                <div key={pillar.title} className={pillarCard}>
                  <div className={pillarIcoBg}>
                    <Icon className={pillarIco} />
                  </div>
                  <div className="flex-1">
                    <p className={pillarTtl}>{pillar.title}</p>
                    <p className={pillarDsc}>{pillar.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Mission statement ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className={banner}>
            <div className={bannerIcoBg}>
              <ShieldCheck className={bannerIco} />
            </div>
            <div>
              <p className={bannerHd}>Part of the EV.ENGINEER Energy Intelligence Platform</p>
              <p className={bannerBd}>
                The Battery Trust Platform is a private, restricted-access product workspace for aerospace engineering teams. Access is controlled at the partner, organisation, and individual user level. If you can see this workspace, your organisation administrator has granted you explicit access.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
