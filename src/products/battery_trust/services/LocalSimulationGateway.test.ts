import { describe, it, expect } from 'vitest'
import { LocalSimulationGateway, buildHappyPathRun } from './LocalSimulationGateway'
import { SCN_HAPPY_001, REF_2W_LFP_51V_V1, HAPPY_PATH_EXPECTED_SCORE } from '../domain/fixtures'

describe('LocalSimulationGateway — happy path', () => {
  it('produces exactly nine step results', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    expect(run.steps).toHaveLength(9)
  })

  it('marks SIM-005 as SKIPPED and every other step as PASS', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    const sim005 = run.steps.find(s => s.simulatorId === 'SIM-005')
    expect(sim005?.status).toBe('SKIPPED')

    const others = run.steps.filter(s => s.simulatorId !== 'SIM-005')
    expect(others.every(s => s.status === 'PASS')).toBe(true)
  })

  it('reaches Mission Ready with no active hard-fail gate and score 96.25', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    expect(run.gateDecision?.hasHardFail).toBe(false)
    expect(run.trustAssessment?.overallScore).toBe(HAPPY_PATH_EXPECTED_SCORE)
    expect(run.trustAssessment?.readinessCode).toBe('MISSION_READY')
  })

  it('tags the run, twin, and evidence package as simulated SYNTHETIC_POC', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    expect(run.simulated).toBe(true)
    expect(run.classification).toBe('SYNTHETIC_POC')
    expect(run.twinSnapshot?.simulated).toBe(true)
    expect(run.evidencePackage?.simulated).toBe(true)
    expect(run.evidencePackage?.classification).toBe('SYNTHETIC_POC')
  })

  it('produces a byte-identical result for the same scenario, seed, and clock', () => {
    const runA = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    const runB = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    expect(runA).toEqual(runB)
  })

  it('builds a twin snapshot and evidence package with matching run/battery IDs', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    expect(run.twinSnapshot?.runId).toBe(run.runId)
    expect(run.twinSnapshot?.batteryId).toBe(run.batteryId)
    expect(run.evidencePackage?.runId).toBe(run.runId)
    expect(run.evidencePackage?.reviewStatus).toBe('DRAFT_NOT_REVIEWED')
  })
})

describe('LocalSimulationGateway — concurrency guard', () => {
  it('rejects a second run while one is already in progress', async () => {
    const gateway = new LocalSimulationGateway()
    const first = gateway.runScenarioAsync(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {}, 10)
    expect(() => gateway.runScenarioAsync(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {}, 10)).toThrow()
    await first
  })

  it('allows a new run after the previous one completes', async () => {
    const gateway = new LocalSimulationGateway()
    await gateway.runScenarioAsync(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {}, 0)
    await expect(gateway.runScenarioAsync(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {}, 0)).resolves.toBeDefined()
  })
})
