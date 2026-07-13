import { describe, it, expect } from 'vitest'
import { SIMULATOR_CATALOG } from './simulatorCatalog'
import { CAPABILITY_PILLARS } from './capabilityPillars'

describe('SIMULATOR_CATALOG', () => {
  it('lists exactly ten unique simulator IDs', () => {
    expect(SIMULATOR_CATALOG).toHaveLength(10)
    const ids = new Set(SIMULATOR_CATALOG.map(s => s.id))
    expect(ids.size).toBe(10)
  })

  it('marks SIM-010 as the orchestrator, not a pipeline step', () => {
    const sim010 = SIMULATOR_CATALOG.find(s => s.id === 'SIM-010')
    expect(sim010?.isOrchestrator).toBe(true)
  })
})

describe('CAPABILITY_PILLARS', () => {
  it('defines exactly six capability pillars', () => {
    expect(CAPABILITY_PILLARS).toHaveLength(6)
  })

  it('every pillar references at least one simulator', () => {
    expect(CAPABILITY_PILLARS.every(p => p.simulatorIds.length > 0)).toBe(true)
  })
})
