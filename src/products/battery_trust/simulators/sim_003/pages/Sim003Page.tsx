import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Play, Square, RotateCcw, Download, Radio, ShieldCheck,
  Wifi, WifiOff,
} from 'lucide-react'
import { useAuth } from '../../../../../auth/hooks/useAuth'
import { SyntheticPocBanner } from '../../../components/SyntheticPocBanner'
import { BATTERY_TRUST_PRODUCT } from '../../../productConfig'
import {
  downloadEvidence, getHealth, startRun, stopRun, streamRun,
} from '../services/sim003Client'
import type {
  Sim003GenerateEventsRequest, Sim003HealthResponse, Sim003ObservedEvent,
  Sim003RunResult, Sim003Scenario,
} from '../types'
import { Sim003Charts } from '../components/Sim003Charts'

const SCENARIOS: { id: Sim003Scenario; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'delayed_telemetry', label: 'Delayed Telemetry' },
  { id: 'duplicate_packet', label: 'Duplicate Packet' },
  { id: 'out_of_range', label: 'Out of Range' },
  { id: 'missing_timestamp', label: 'Missing Timestamp' },
  { id: 'spoofed_identity', label: 'Spoofed Identity' },
  { id: 'replay_attack', label: 'Replay Attack' },
]

const PIPELINE_STAGES = ['Generator', 'Publisher', 'Mosquitto', 'Subscriber', 'Schema Validator', 'Detection Engine', 'Evidence']

type Stage = 'Waiting' | 'Running' | 'Connected' | 'Degraded' | 'Passed' | 'Failed'

interface GuardianActivity {
  agent: string
  message: string
  at: string
}

export function Sim003Page() {
  const { user } = useAuth()

  const [health, setHealth] = useState<Sim003HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  const [batteryId, setBatteryId] = useState('SIM-BAT-001')
  const [scenario, setScenario] = useState<Sim003Scenario>('normal')
  const [numEvents, setNumEvents] = useState(10)
  const [intervalMs, setIntervalMs] = useState(500)
  const [delaySeconds, setDelaySeconds] = useState(60)
  const [replayWindowSeconds, setReplayWindowSeconds] = useState(300)
  const [qos, setQos] = useState<0 | 1 | 2>(1)
  const [seed, setSeed] = useState(42)
  const [useInMemoryFallback, setUseInMemoryFallback] = useState(false)

  const [runId, setRunId] = useState<string | null>(null)
  const [runStatus, setRunStatus] = useState<Stage>('Waiting')
  const [events, setEvents] = useState<Sim003ObservedEvent[]>([])
  const [finalRun, setFinalRun] = useState<Sim003RunResult | null>(null)
  const [guardianLog, setGuardianLog] = useState<GuardianActivity[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [anomalyFilter, setAnomalyFilter] = useState<string>('ALL')
  const [selectedEvent, setSelectedEvent] = useState<Sim003ObservedEvent | null>(null)

  const streamController = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(h => { if (!cancelled) setHealth(h) })
      .catch(e => { if (!cancelled) setHealthError((e as Error).message) })
    const interval = setInterval(() => {
      getHealth().then(h => { if (!cancelled) { setHealth(h); setHealthError(null) } }).catch(e => { if (!cancelled) setHealthError((e as Error).message) })
    }, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  useEffect(() => () => streamController.current?.abort(), [])

  const brokerDisconnected = health !== null && health.transport_mode === 'mqtt' && !health.broker_connected
  const startDisabled = runStatus === 'Running' || (brokerDisconnected && !useInMemoryFallback) || healthError !== null

  function pushGuardianLog(agent: string, message: string) {
    setGuardianLog(prev => [...prev.slice(-49), { agent, message, at: new Date().toISOString() }])
  }

  async function handleStart() {
    setErrorMessage(null)
    setEvents([])
    setFinalRun(null)
    setGuardianLog([])
    setRunStatus('Running')

    const body: Sim003GenerateEventsRequest = {
      battery_id: batteryId,
      scenario,
      num_events: numEvents,
      interval_ms: intervalMs,
      qos,
      seed,
      transport: useInMemoryFallback ? 'in_memory' : undefined,
      ...(scenario === 'delayed_telemetry' ? { delay_seconds: delaySeconds } : {}),
      ...(scenario === 'replay_attack' ? { replay_window_seconds: replayWindowSeconds } : {}),
    }

    pushGuardianLog('Scenario Agent', `Configured ${scenario} scenario for ${batteryId} (seed ${seed}).`)

    try {
      const { run_id } = await startRun(body, user ? (user as unknown as import('firebase/auth').User) : null)
      setRunId(run_id)
      pushGuardianLog('Publisher Agent', `Run ${run_id} started — publishing ${numEvents} events at QoS ${qos}.`)

      streamController.current = streamRun(run_id, user ? (user as unknown as import('firebase/auth').User) : null, {
        onObservation: (event) => {
          setEvents(prev => [...prev.slice(-999), event])
          if (event.detection.primary_anomaly !== 'NONE') {
            const agent = event.detection.primary_anomaly === 'REPLAY_DETECTED' ? 'Replay Detection Agent' : 'Telemetry Validation Agent'
            pushGuardianLog(agent, `Sequence ${event.payload.sequence_number}: ${event.detection.primary_anomaly}${event.detection.anomaly_detail ? ` — ${event.detection.anomaly_detail}` : ''}`)
          }
        },
        onCompleted: (run) => {
          setFinalRun(run)
          setRunStatus(run.status === 'PASSED' ? 'Passed' : run.status === 'DEGRADED' ? 'Degraded' : run.status === 'FAILED' ? 'Failed' : 'Waiting')
          pushGuardianLog('Evidence Agent', `Run ${run.run_id} completed with status ${run.status} — evidence package ready.`)
        },
        onError: (err) => {
          setErrorMessage((err as Error).message ?? 'Stream error')
          setRunStatus('Failed')
        },
      })
    } catch (err) {
      setErrorMessage((err as Error).message ?? 'Failed to start run')
      setRunStatus('Failed')
    }
  }

  async function handleStop() {
    if (!runId) return
    streamController.current?.abort()
    await stopRun(runId, user ? (user as unknown as import('firebase/auth').User) : null).catch(() => undefined)
    setRunStatus('Waiting')
  }

  function handleReset() {
    streamController.current?.abort()
    setRunId(null)
    setRunStatus('Waiting')
    setEvents([])
    setFinalRun(null)
    setGuardianLog([])
    setErrorMessage(null)
  }

  async function handleExport(format: 'json' | 'html') {
    if (!runId) return
    await downloadEvidence(runId, format, user ? (user as unknown as import('firebase/auth').User) : null)
  }

  const filteredEvents = useMemo(
    () => (anomalyFilter === 'ALL' ? events : events.filter(e => e.detection.primary_anomaly === anomalyFilter)),
    [events, anomalyFilter],
  )

  const kpis = {
    generated: finalRun?.generated_count ?? (runStatus === 'Running' ? numEvents : 0),
    published: finalRun?.published_count ?? events.length,
    observed: finalRun?.observed_count ?? events.length,
    valid: finalRun?.valid_count ?? events.filter(e => e.observation.schema_valid).length,
    anomalies: finalRun ? Object.values(finalRun.anomaly_counts).reduce((s, v) => s + v, 0) : events.filter(e => e.detection.primary_anomaly !== 'NONE').length,
    avgPublishLatency: average(events.map(e => e.publish.latency_ms ?? undefined)),
    avgReceiveLatencyMs: averageReceiveLatency(events),
  }

  const pipelineStageStatus: Record<string, Stage> = {
    Generator: runStatus === 'Waiting' ? 'Waiting' : 'Passed',
    Publisher: runStatus === 'Waiting' ? 'Waiting' : (runStatus === 'Failed' ? 'Failed' : 'Passed'),
    Mosquitto: health?.transport_mode === 'mqtt' ? (health.broker_connected ? 'Connected' : 'Degraded') : 'Connected',
    Subscriber: events.length > 0 ? 'Passed' : (runStatus === 'Running' ? 'Running' : 'Waiting'),
    'Schema Validator': events.length > 0 ? 'Passed' : 'Waiting',
    'Detection Engine': events.length > 0 ? 'Passed' : 'Waiting',
    Evidence: finalRun ? 'Passed' : 'Waiting',
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-secondary flex-wrap">
            <Link to={BATTERY_TRUST_PRODUCT.routeBase} className="hover:text-primary">Battery Trust Platform</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={BATTERY_TRUST_PRODUCT.routeBase} className="hover:text-primary">Simulators</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-text-primary">SIM-003</span>
          </nav>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
            <div>
              <h1 className="text-lg font-bold text-text-primary">MQTT Telemetry Simulator</h1>
              <p className="text-xs text-text-secondary">Synthetic BMS telemetry over local Mosquitto — observable, detectable, exportable.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">SYNTHETIC</span>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-background text-text-secondary border border-border">{health?.transport_mode === 'mqtt' ? 'LOCAL MOSQUITTO' : 'IN-MEMORY'}</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border inline-flex items-center gap-1 ${health?.broker_connected || health?.transport_mode === 'in_memory' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {health?.broker_connected || health?.transport_mode === 'in_memory' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {healthError ? 'BACKEND UNREACHABLE' : health?.broker_connected || health?.transport_mode === 'in_memory' ? 'BROKER OK' : 'BROKER DISCONNECTED'}
              </span>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-background text-text-secondary border border-border">RUN: {runStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <SyntheticPocBanner className="mx-4 sm:mx-6 mb-2" />
      </header>

      {healthError && (
        <div className="mx-4 sm:mx-6 mt-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
          Cannot reach the SIM-003 backend (services/sim-003-mqtt). Start it locally — see docs/README.md — then reload this page.
        </div>
      )}
      {errorMessage && (
        <div className="mx-4 sm:mx-6 mt-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{errorMessage}</div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-[1600px] mx-auto w-full gap-4 p-4 sm:p-6">
        {/* Left — control panel */}
        <aside className="lg:w-72 shrink-0 bg-white border border-border rounded-xl p-4 space-y-3 h-fit">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Scenario Control</p>

          <label className="block text-xs font-semibold text-text-secondary">Battery ID
            <input value={batteryId} onChange={e => setBatteryId(e.target.value)} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
          </label>

          <label className="block text-xs font-semibold text-text-secondary">Scenario
            <select value={scenario} onChange={e => setScenario(e.target.value as Sim003Scenario)} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5">
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-text-secondary">Count
              <input type="number" min={1} max={1000} value={numEvents} onChange={e => setNumEvents(Number(e.target.value))} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
            </label>
            <label className="block text-xs font-semibold text-text-secondary">Interval (ms)
              <input type="number" min={50} max={10000} value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
            </label>
          </div>

          {scenario === 'delayed_telemetry' && (
            <label className="block text-xs font-semibold text-text-secondary">Delay (seconds)
              <input type="number" min={1} max={300} value={delaySeconds} onChange={e => setDelaySeconds(Number(e.target.value))} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
            </label>
          )}
          {scenario === 'replay_attack' && (
            <label className="block text-xs font-semibold text-text-secondary">Replay window (seconds)
              <input type="number" min={1} max={3600} value={replayWindowSeconds} onChange={e => setReplayWindowSeconds(Number(e.target.value))} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-text-secondary">QoS
              <select value={qos} onChange={e => setQos(Number(e.target.value) as 0 | 1 | 2)} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5">
                <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-text-secondary">Seed
              <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))} className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-1.5" />
            </label>
          </div>

          {brokerDisconnected && (
            <label className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <input type="checkbox" checked={useInMemoryFallback} onChange={e => setUseInMemoryFallback(e.target.checked)} />
              Broker disconnected — explicitly use in-memory fallback (offline mode)
            </label>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleStart} disabled={startDisabled} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              <Play className="w-3.5 h-3.5" /> Start
            </button>
            <button type="button" onClick={handleStop} disabled={runStatus !== 'Running'} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold disabled:opacity-40">
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
            <button type="button" onClick={handleReset} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleExport('json')} disabled={!finalRun} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary text-primary text-xs font-semibold disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
            <button type="button" onClick={() => handleExport('html')} disabled={!finalRun} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary text-primary text-xs font-semibold disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> HTML
            </button>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 min-w-0 space-y-4">
          <section className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Pipeline</p>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map(stage => (
                <span key={stage} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stageTone(pipelineStageStatus[stage])}`}>
                  {stage}: {pipelineStageStatus[stage]}
                </span>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <Kpi label="Generated" value={kpis.generated} />
            <Kpi label="Published" value={kpis.published} />
            <Kpi label="Observed" value={kpis.observed} />
            <Kpi label="Valid" value={kpis.valid} />
            <Kpi label="Anomalies" value={kpis.anomalies} />
            <Kpi label="Avg Publish (ms)" value={kpis.avgPublishLatency?.toFixed(2) ?? '—'} />
            <Kpi label="Avg Receive (ms)" value={kpis.avgReceiveLatencyMs?.toFixed(2) ?? '—'} />
          </section>

          <section className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Live Telemetry</p>
            <Sim003Charts
              voltage={events.slice(-50).map(e => e.payload.voltage_v)}
              current={events.slice(-50).map(e => e.payload.current_a)}
              temperature={events.slice(-50).map(e => e.payload.temperature_c)}
              soc={events.slice(-50).map(e => e.payload.soc_percent)}
            />
          </section>

          <section className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Event Stream</p>
              <select value={anomalyFilter} onChange={e => setAnomalyFilter(e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1">
                <option value="ALL">All anomalies</option>
                <option value="NONE">None</option>
                <option value="DELAYED_TELEMETRY">Delayed</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="OUT_OF_RANGE">Out of range</option>
                <option value="MISSING_TIMESTAMP">Missing timestamp</option>
                <option value="SPOOFED_IDENTITY">Spoofed identity</option>
                <option value="REPLAY_DETECTED">Replay detected</option>
              </select>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-text-secondary uppercase">
                    <th className="py-1.5 pr-2">Seq</th><th className="py-1.5 pr-2">Battery ID</th><th className="py-1.5 pr-2">QoS</th>
                    <th className="py-1.5 pr-2">Voltage</th><th className="py-1.5 pr-2">Current</th><th className="py-1.5 pr-2">Temp</th>
                    <th className="py-1.5 pr-2">SOC</th><th className="py-1.5 pr-2">Anomaly</th><th className="py-1.5 pr-2">Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(e => (
                    <tr key={e.payload.event_id} className="border-t border-border hover:bg-background cursor-pointer" onClick={() => setSelectedEvent(e)}>
                      <td className="py-1.5 pr-2 font-mono">{e.payload.sequence_number}</td>
                      <td className="py-1.5 pr-2 font-mono">{e.payload.battery_id}</td>
                      <td className="py-1.5 pr-2">{e.qos}</td>
                      <td className="py-1.5 pr-2">{e.payload.voltage_v.toFixed(1)}V</td>
                      <td className="py-1.5 pr-2">{e.payload.current_a.toFixed(1)}A</td>
                      <td className="py-1.5 pr-2">{e.payload.temperature_c.toFixed(1)}°C</td>
                      <td className="py-1.5 pr-2">{e.payload.soc_percent.toFixed(1)}%</td>
                      <td className="py-1.5 pr-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${e.detection.primary_anomaly === 'NONE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {e.detection.primary_anomaly}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2">{e.observation.schema_valid ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr><td colSpan={9} className="py-4 text-center text-text-secondary">No events yet. Select Start to run a scenario.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedEvent && (
            <section className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Selected Event — {selectedEvent.payload.event_id}</p>
              {selectedEvent.detection.anomaly_detail && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">{selectedEvent.detection.anomaly_detail}</p>
              )}
              <pre className="text-xs bg-background border border-border rounded-lg p-3 overflow-x-auto">{JSON.stringify(selectedEvent, null, 2)}</pre>
            </section>
          )}

          {finalRun && (
            <section className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Evidence &amp; Limitations</p>
              <p className="text-sm text-text-primary mb-2">
                Scenario <strong>{finalRun.scenario}</strong> — {finalRun.status} — reconciled {finalRun.generated_count}/{finalRun.published_count}/{finalRun.observed_count} (generated/published/observed).
              </p>
              <ul className="list-disc list-inside text-xs text-text-secondary space-y-0.5">
                <li>All data synthetic — EDUCATIONAL_SIMULATION_ONLY.</li>
                <li>Local plaintext MQTT on loopback only — not for remote/customer deployment.</li>
                <li>No local or cloud AI model is used to make this determination.</li>
              </ul>
            </section>
          )}
        </main>

        {/* Right — Telemetry Guardian */}
        <aside className="lg:w-80 shrink-0 bg-white border border-border rounded-xl p-4 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-text-primary">Telemetry Guardian</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Decision source: Deterministic Rules</p>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {guardianLog.length === 0 && <p className="text-xs text-text-secondary">No activity yet.</p>}
            {[...guardianLog].reverse().map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Radio className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-text-primary">{item.agent}</p>
                  <p className="text-text-secondary">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3 text-center">
      <p className="text-xl font-extrabold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function stageTone(stage: Stage): string {
  switch (stage) {
    case 'Passed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Connected': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Running': return 'bg-blue-50 text-primary border-blue-200'
    case 'Degraded': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Failed': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-background text-text-secondary border-border'
  }
}

function average(values: (number | undefined)[]): number | undefined {
  const defined = values.filter((v): v is number => typeof v === 'number')
  if (defined.length === 0) return undefined
  return defined.reduce((s, v) => s + v, 0) / defined.length
}

function averageReceiveLatency(events: Sim003ObservedEvent[]): number | undefined {
  const latencies = events
    .filter(e => e.publish.published_at)
    .map(e => new Date(e.observation.received_at).getTime() - new Date(e.publish.published_at as string).getTime())
    .filter(v => Number.isFinite(v) && v >= 0)
  if (latencies.length === 0) return undefined
  return latencies.reduce((s, v) => s + v, 0) / latencies.length
}
