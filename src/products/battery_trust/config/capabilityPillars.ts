import type { CapabilityPillar } from '../domain/types'

// Six capability pillars — FAI blue remains the primary product action
// colour; these accents are semantic pillar labels only (see design system
// notes in the architecture blueprint §6.5).

export const CAPABILITY_PILLARS: CapabilityPillar[] = [
  {
    id: 'battery_aadhaar',
    title: 'Battery Aadhaar',
    description: 'Identity, ownership, passport, and provenance for every synthetic battery.',
    accent: 'blue',
    simulatorIds: ['SIM-001', 'SIM-002'],
  },
  {
    id: 'battery_intelligence',
    title: 'Battery Intelligence',
    description: 'SOH/SOC, degradation trend, and performance context.',
    accent: 'green',
    simulatorIds: ['SIM-008'],
  },
  {
    id: 'safety',
    title: 'Safety',
    description: 'Thermal, voltage, current, and cell-imbalance operating limits.',
    accent: 'orange',
    simulatorIds: ['SIM-006', 'SIM-008'],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Safe synthetic threat scenarios, firmware/configuration integrity, incidents.',
    accent: 'purple',
    simulatorIds: ['SIM-005', 'SIM-006'],
  },
  {
    id: 'telemetry',
    title: 'Telemetry',
    description: 'Event flow, freshness, sequencing, and data integrity.',
    accent: 'cyan',
    simulatorIds: ['SIM-003'],
  },
  {
    id: 'mission_readiness',
    title: 'Mission Readiness',
    description: 'Gates, trust assessment, decision support, and evidence.',
    accent: 'pink',
    simulatorIds: ['SIM-004', 'SIM-007', 'SIM-009', 'SIM-010'],
  },
]
