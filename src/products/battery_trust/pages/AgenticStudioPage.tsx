import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Play, CheckCircle2, GitCompare, Download, LayoutGrid, MonitorPlay, Rocket } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useUserOrg } from '../../../hooks/useUserOrg'
import { UserAvatarMenu } from '../../../components/ui/UserAvatarMenu'
import { SyntheticPocBanner } from '../components/SyntheticPocBanner'
import { PipelineCanvas } from '../components/PipelineCanvas'
import { AgentActivityPanel } from '../components/AgentActivityPanel'
import { RunConsole } from '../components/RunConsole'
import { StudioResultPanels } from '../components/StudioResultPanels'
import { LocalSimulationGateway } from '../services/LocalSimulationGateway'
import { downloadTextFile, evidenceToJson } from '../services/evidenceExport'
import { saveLastRunSummary } from '../services/lastRunStore'
import { SCN_HAPPY_001, REF_2W_LFP_51V_V1 } from '../domain/fixtures'
import type { SimulationRun } from '../domain/types'
import { BATTERY_TRUST_PRODUCT } from '../productConfig'

type Mode = 'builder' | 'studio'

export function AgenticStudioPage() {
  const { user } = useAuth()
  const { org }  = useUserOrg()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mode, setMode]                   = useState<Mode>('builder')
  const [run, setRun]                     = useState<SimulationRun | null>(null)
  const [isRunning, setIsRunning]         = useState(false)
  const [selectedStep, setSelectedStep]   = useState<number | null>(null)
  const [validation, setValidation]       = useState<string | null>(null)

  const gatewayRef = useRef(new LocalSimulationGateway())

  const handleValidate = () => {
    setValidation(`Scenario ${SCN_HAPPY_001.scenarioId} valid — battery profile ${REF_2W_LFP_51V_V1.profileId}, policy ${SCN_HAPPY_001.policyProfileId} resolved.`)
  }

  const handleSimulate = async () => {
    if (isRunning) return
    setIsRunning(true)
    setValidation(null)
    try {
      const result = await gatewayRef.current.runScenarioAsync(
        SCN_HAPPY_001,
        REF_2W_LFP_51V_V1,
        { organisationName: org?.name, actorDisplayName: user?.displayName ?? user?.email ?? undefined },
        500,
      )
      setRun(result)
      setMode('studio')
      setSelectedStep(result.steps.length - 1)
      saveLastRunSummary(result, REF_2W_LFP_51V_V1.profileId)
    } finally {
      setIsRunning(false)
    }
  }

  // "Run Mission-Ready Demo" from Battery Trust Home links here with
  // ?autorun=1 so the happy-path scenario starts immediately.
  useEffect(() => {
    if (searchParams.get('autorun') === '1' && !run && !isRunning) {
      setSearchParams(prev => { prev.delete('autorun'); return prev }, { replace: true })
      void handleSimulate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleExportEvidence = () => {
    if (!run?.evidencePackage) return
    downloadTextFile(`battery-trust-evidence-${run.evidencePackage.runId}.json`, evidenceToJson(run.evidencePackage), 'application/json')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Top command bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-secondary min-w-0">
            <Link to="/dashboard" className="hover:text-primary shrink-0">FAI.EV.ENGINEER</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to={BATTERY_TRUST_PRODUCT.routeBase} className="hover:text-primary shrink-0">Battery Trust</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-text-primary truncate">Agentic Studio — {SCN_HAPPY_001.name}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-border overflow-hidden" role="tablist" aria-label="Builder or Studio mode">
              <button
                type="button" role="tab" aria-selected={mode === 'builder'}
                onClick={() => setMode('builder')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${mode === 'builder' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:text-text-primary'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Builder
              </button>
              <button
                type="button" role="tab" aria-selected={mode === 'studio'}
                onClick={() => setMode('studio')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${mode === 'studio' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:text-text-primary'}`}
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Studio
              </button>
            </div>

            <button type="button" onClick={handleValidate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-background">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validate
            </button>

            <button
              type="button" onClick={handleSimulate} disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" /> {isRunning ? 'Simulating…' : 'Simulate'}
            </button>

            <button
              type="button" disabled
              title="Available once a second scenario run exists (POC-005)."
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary opacity-60 cursor-not-allowed"
            >
              <GitCompare className="w-3.5 h-3.5" /> Compare Run
            </button>

            <button
              type="button" onClick={handleExportEvidence} disabled={!run}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed disabled:border-border disabled:text-text-secondary"
            >
              <Download className="w-3.5 h-3.5" /> Export Evidence
            </button>

            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">POC / Beta</span>
          </div>
        </div>
        <SyntheticPocBanner className="mx-4 sm:mx-6 mb-2" />
        {validation && <p className="mx-4 sm:mx-6 mb-2 text-xs text-emerald-700 font-semibold">{validation}</p>}
      </header>

      {/* ── Body: left / center / right ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-[1600px] mx-auto w-full">
        {/* Left — scenario library */}
        <aside className="lg:w-64 shrink-0 border-r border-border bg-white p-4 space-y-4 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Active Battery Profile</p>
            <p className="text-sm font-semibold text-text-primary">{REF_2W_LFP_51V_V1.profileId}</p>
            <p className="text-xs text-text-secondary">{REF_2W_LFP_51V_V1.chemistry} · {REF_2W_LFP_51V_V1.nominalVoltageV}V · {REF_2W_LFP_51V_V1.seriesCount}S{REF_2W_LFP_51V_V1.parallelCount}P</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Mission Scenario</p>
            <p className="text-sm font-semibold text-text-primary">{SCN_HAPPY_001.scenarioId}</p>
            <p className="text-xs text-text-secondary">{SCN_HAPPY_001.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Scenario Inputs</p>
            <ul className="text-xs text-text-secondary space-y-0.5">
              <li>Identity: {SCN_HAPPY_001.identityScenario}</li>
              <li>Health: {SCN_HAPPY_001.healthScenario}</li>
              <li>Telemetry: {SCN_HAPPY_001.telemetryScenario}</li>
              <li>Attack: {SCN_HAPPY_001.attackScenario}</li>
              <li>Policy: {SCN_HAPPY_001.policyProfileId}</li>
              <li>Trust profile: {SCN_HAPPY_001.trustProfileId}</li>
              <li>Seed: {SCN_HAPPY_001.seed}</li>
            </ul>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {mode === 'builder' && (
              run
                ? <PipelineCanvas steps={run.steps} selectedIndex={selectedStep} onSelect={setSelectedStep} />
                : <BuilderEmptyState isRunning={isRunning} onSimulate={handleSimulate} />
            )}
            {mode === 'studio' && <StudioResultPanels run={run} />}
          </div>
          <div className="h-56 shrink-0 border-t border-border">
            <RunConsole run={run} />
          </div>
        </main>

        {/* Right — Agent Activity */}
        <aside className="lg:w-80 shrink-0 border-l border-border bg-white overflow-y-auto">
          <AgentActivityPanel plan={run?.agentPlan ?? buildIdlePlan()} activity={run?.agentActivity ?? []} />
        </aside>
      </div>

      <div className="lg:hidden p-2">
        <UserAvatarMenu />
      </div>
    </div>
  )
}

function BuilderEmptyState({ isRunning, onSimulate }: { isRunning: boolean; onSimulate: () => void }) {
  const steps = [
    'SIM-001 Battery Profile', 'SIM-002 Identity', 'SIM-008 Health', 'SIM-003 Telemetry',
    'SIM-005 Attack (skipped)', 'SIM-006 Detection & Gates', 'SIM-004 Trust Assessment',
    'SIM-007 Twin Snapshot', 'SIM-009 Evidence',
  ]
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
        <Rocket className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-base font-bold text-text-primary mb-1.5">Ready to run the Mission Ready happy path</h3>
      <p className="text-sm text-text-secondary max-w-md mb-5">
        Nine deterministic steps will run in order — identity, health, and telemetry first, then detection, trust scoring, twin, and evidence. SIM-005 is skipped because no attack scenario is selected.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 max-w-lg mb-6">
        {steps.map(s => (
          <span key={s} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-background border border-border text-text-secondary">{s}</span>
        ))}
      </div>
      <button
        type="button" onClick={onSimulate} disabled={isRunning}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Play className="w-4 h-4" /> {isRunning ? 'Simulating…' : 'Simulate Now'}
      </button>
    </div>
  )
}

function buildIdlePlan() {
  return {
    goal: `Assess whether ${REF_2W_LFP_51V_V1.profileId} is trusted for the "${SCN_HAPPY_001.name}" scenario. Select Simulate to generate the plan and run the pipeline.`,
    providerLabel: 'Deterministic Local Orchestrator',
    modelLabel: 'Not connected in POC-001',
    approvalRequired: false,
    assumptions: [],
    steps: [],
  }
}
