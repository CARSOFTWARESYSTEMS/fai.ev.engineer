import { describe, it, expect } from 'vitest'
import { evaluateGates, applyGatePrecedence, HARD_GATE_CATALOG } from './gateEngine'

describe('gateEngine', () => {
  it('has 11 hard-fail gate definitions matching the AEROSPACE_POC_V1 catalog', () => {
    expect(HARD_GATE_CATALOG).toHaveLength(11)
  })

  it('reports no hard fail when no gates are active', () => {
    const decision = evaluateGates([], '2026-07-13T06:00:00.000Z')
    expect(decision.hasHardFail).toBe(false)
    expect(decision.activeGates).toHaveLength(0)
  })

  it('reports hard fail when at least one gate is active', () => {
    const decision = evaluateGates(['replay_attack'], '2026-07-13T06:00:00.000Z')
    expect(decision.hasHardFail).toBe(true)
    expect(decision.activeGates).toHaveLength(1)
    expect(decision.activeGates[0].gateId).toBe('replay_attack')
  })

  it('a triggered hard-fail gate always yields GROUNDED regardless of a high score band', () => {
    const decision = evaluateGates(['critical_voltage'], '2026-07-13T06:00:00.000Z')
    expect(applyGatePrecedence(decision, 'MISSION_READY')).toBe('GROUNDED')
  })

  it('preserves the score band when no gate is active', () => {
    const decision = evaluateGates([], '2026-07-13T06:00:00.000Z')
    expect(applyGatePrecedence(decision, 'MISSION_READY')).toBe('MISSION_READY')
  })
})
