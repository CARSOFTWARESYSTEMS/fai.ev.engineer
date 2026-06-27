import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Activity, BarChart2, Wrench, Globe, FileBarChart,
  Lock, ChevronRight, ArrowLeft, Loader2,
  ClipboardList, Users, Star,
} from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useAuth } from '../auth/hooks/useAuth'
import { useUserOrg } from '../hooks/useUserOrg'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'
import { BetaWatermark } from '../components/ui/BetaWatermark'
import { useEosRole } from '../features/batteryEos/hooks/useEosRole'
import { useDailyCheckin } from '../features/batteryEos/hooks/useDailyCheckin'
import { useWpStoryStates } from '../features/batteryEos/hooks/useWpStoryStates'
import { WP001_BATTERY_AADHAAR } from '../features/batteryEos/data/wp001.seed'
import { WP005_BATTERY_CYBERSECURITY } from '../features/batteryEos/data/wp005.seed'
import { WorkPackageCard } from '../features/batteryEos/components/WorkPackageCard'
import { WorkPackageDetail } from '../features/batteryEos/components/WorkPackageDetail'
import { DailyCheckinPanel } from '../features/batteryEos/components/DailyCheckinPanel'
import { EngineerDashboard } from '../features/batteryEos/components/EngineerDashboard'
import { ManagerDashboard } from '../features/batteryEos/components/ManagerDashboard'
import { ReviewQueue } from '../features/batteryEos/components/ReviewQueue'
import type { EosWorkPackage } from '../features/batteryEos/types/eos.types'

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_PACKAGES: EosWorkPackage[] = [WP001_BATTERY_AADHAAR, WP005_BATTERY_CYBERSECURITY]

interface PillarDef {
  icon:        React.ComponentType<{ className?: string }>
  iconBg:      string
  iconColor:   string
  title:       string
  description: string
  status:      'coming-soon' | 'planned'
}

const PILLARS: PillarDef[] = [
  {
    icon: ShieldCheck, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
    title: 'Battery Aadhaar',
    description: 'Digital identity for every battery. Unique fingerprint, provenance, and chain of custody for mission-critical cells.',
    status: 'coming-soon',
  },
  {
    icon: Activity, iconBg: 'bg-green-50', iconColor: 'text-green-600',
    title: 'Battery Health',
    description: 'Real-time SOC, SOH, temperature, voltage, current, and cycle count monitoring for aerospace battery systems.',
    status: 'coming-soon',
  },
  {
    icon: BarChart2, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
    title: 'Usage Analytics',
    description: 'Charge/discharge behaviour, mission usage profiles, energy patterns, and consumption trends.',
    status: 'coming-soon',
  },
  {
    icon: Wrench, iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
    title: 'Predictive Maintenance',
    description: 'Early warnings for cell degradation, capacity fade, thermal runaway risk, and predictive failure detection.',
    status: 'coming-soon',
  },
  {
    icon: Lock, iconBg: 'bg-red-50', iconColor: 'text-red-600',
    title: 'Battery Cybersecurity',
    description: 'Detect spoofing, replay attacks, telemetry tampering, and unauthorised BMS access in mission-critical systems.',
    status: 'coming-soon',
  },
  {
    icon: Globe, iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
    title: 'Battery Digital Twin',
    description: 'Virtual battery model for simulation, what-if analysis, and predictive life cycle assessment.',
    status: 'planned',
  },
  {
    icon: FileBarChart, iconBg: 'bg-teal-50', iconColor: 'text-teal-600',
    title: 'Reports',
    description: 'Battery health, safety compliance, cybersecurity posture, and mission-readiness reports.',
    status: 'coming-soon',
  },
]

type Tab = 'overview' | 'my_work' | 'team' | 'reviews'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BatteryIntelligencePage() {
  const { branding }         = useBranding()
  const { firebaseUser }     = useAuth()
  const { org }              = useUserOrg()
  const access               = useEosRole()
  const { todayCheckin, hasCheckedIn, isLoading: checkinLoading, refresh: refreshCheckin } = useDailyCheckin()

  // Live Firestore story states for both active WPs
  const { storyStates: wp001States } = useWpStoryStates('WP-001')
  const { storyStates: wp005States } = useWpStoryStates('WP-005')
  const allStoryStates = { ...wp001States, ...wp005States }

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [openWp,    setOpenWp]    = useState<EosWorkPackage | null>(null)

  // Build visible tabs
  const visibleTabs: { id: Tab; label: string; icon: React.ComponentType<{className?:string}> }[] = [
    { id: 'overview',  label: 'Overview',  icon: ShieldCheck  },
    ...(access.isEngineer ? [{ id: 'my_work' as Tab, label: 'My Work',  icon: ClipboardList }] : []),
    ...(access.isManager  ? [{ id: 'team'    as Tab, label: 'Team',     icon: Users         }] : []),
    ...(access.isReviewer ? [{ id: 'reviews' as Tab, label: 'Reviews',  icon: Star          }] : []),
  ]

  // Engineer check-in gate — while loading checkin status, show spinner
  const checkinGateLoading = access.isEngineer && checkinLoading
  const needsCheckin       = access.isEngineer && !checkinLoading && !hasCheckedIn

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BetaWatermark />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="hidden sm:block text-sm text-text-secondary group-hover:text-primary transition-colors">
                  {branding.businessName}
                </span>
              </Link>
              <ChevronRight className="w-4 h-4 text-border shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">
                  Battery Intelligence &amp; Cybersecurity
                </span>
              </div>
            </div>
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* ── Engineer check-in gate: loading ─────────────────────────────── */}
        {checkinGateLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-text-secondary">Loading your engineering workspace…</p>
          </div>
        )}

        {/* ── Engineer check-in gate: form ────────────────────────────────── */}
        {needsCheckin && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <ClipboardList className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">Daily check-in required</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Submit your engineering check-in to unlock the workspace for today.
                </p>
              </div>
            </div>
            <div className="max-w-xl">
              <DailyCheckinPanel onSubmitted={refreshCheckin} />
            </div>
          </div>
        )}

        {/* ── Workspace ───────────────────────────────────────────────────── */}
        {!checkinGateLoading && !needsCheckin && (
          <>
            {/* Tab navigation */}
            {visibleTabs.length > 1 && (
              <div className="flex items-center gap-1 border-b border-border -mb-2">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Overview tab ────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">

                {/* Hero */}
                <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-bold text-text-primary">
                        Battery Intelligence &amp; Cybersecurity
                      </h1>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        NEW
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                        EOS Workspace
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                      Secure battery systems for aerospace teams. Monitor health, detect cybersecurity threats,
                      predict failures, and ensure mission-critical safety across your battery fleet.
                    </p>
                    <p className="text-xs text-text-secondary/70 mt-3 italic">
                      Engineering Operating System active — work packages, milestones, and stories are in progress.
                    </p>
                  </div>
                </div>

                {/* Active Work Packages */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-text-primary">Active Work Packages</h2>
                    <span className="text-xs font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                      {WORK_PACKAGES.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {WORK_PACKAGES.map(wp => (
                      <WorkPackageCard
                        key={wp.workPackageId}
                        wp={wp}
                        access={access}
                        onInfo={() => setOpenWp(wp)}
                        onDemo={() => setOpenWp(wp)}
                        onEngineering={() => setOpenWp(wp)}
                        activeView={openWp?.workPackageId === wp.workPackageId ? 'engineering' : undefined}
                      />
                    ))}
                  </div>
                </div>

                {/* Product pillars */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-text-primary">Product Capabilities</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {PILLARS.map(pillar => {
                      const Icon       = pillar.icon
                      const statusLabel = pillar.status === 'coming-soon' ? 'Coming Soon' : 'Planned'
                      const statusCls   = pillar.status === 'coming-soon'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                      return (
                        <div key={pillar.title} className="border border-border rounded-xl p-4 bg-white flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`w-9 h-9 rounded-lg ${pillar.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${pillar.iconColor}`} />
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCls}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-text-primary leading-snug mb-1">{pillar.title}</p>
                            <p className="text-xs text-text-secondary leading-relaxed">{pillar.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Platform context */}
                <div className="rounded-xl border border-primary/20 bg-primary-light p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary mb-1">
                        Part of the EV.ENGINEER Energy Intelligence Platform
                      </p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Battery Intelligence &amp; Cybersecurity is the first major product in the EV.ENGINEER
                        Energy Intelligence Platform — designed to give aerospace teams full visibility, security,
                        and predictive intelligence over mission-critical battery systems.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── My Work tab ─────────────────────────────────────────────── */}
            {activeTab === 'my_work' && access.isEngineer && (
              <EngineerDashboard
                workPackages={WORK_PACKAGES}
                storyStates={allStoryStates}
                todayCheckin={todayCheckin}
                userEmail={firebaseUser?.email ?? undefined}
              />
            )}

            {/* ── Team tab ────────────────────────────────────────────────── */}
            {activeTab === 'team' && access.isManager && (
              <ManagerDashboard
                workPackages={WORK_PACKAGES}
                storyStates={allStoryStates}
              />
            )}

            {/* ── Reviews tab ─────────────────────────────────────────────── */}
            {activeTab === 'reviews' && access.isReviewer && (
              <ReviewQueue
                workPackages={WORK_PACKAGES}
                storyStates={allStoryStates}
                reviewerEmail={firebaseUser?.email ?? ''}
                reviewerUid={firebaseUser?.uid ?? ''}
                organisationId={org?.organisationId}
                partnerId={org?.partnerId}
              />
            )}
          </>
        )}
      </main>

      {/* ── Work Package Detail overlay ─────────────────────────────────────── */}
      {openWp && (
        <WorkPackageDetail
          wp={openWp}
          storyStates={allStoryStates}
          access={access}
          onClose={() => setOpenWp(null)}
        />
      )}
    </div>
  )
}
