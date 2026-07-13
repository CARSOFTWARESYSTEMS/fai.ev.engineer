import type { SimulatorDescriptor } from '../domain/types'

// Configuration-driven simulator catalog — the Simulator Catalog and Studio
// pipeline both render from this single source instead of ten hard-coded
// card components.

export const SIMULATOR_CATALOG: SimulatorDescriptor[] = [
  { id: 'SIM-001', name: 'Battery Pack Simulator',            description: 'Battery profile source — identity, chemistry, configuration.', pillar: 'battery_aadhaar' },
  { id: 'SIM-002', name: 'Battery Identity Simulator',        description: 'Identity and custody verification.', pillar: 'battery_aadhaar' },
  { id: 'SIM-003', name: 'MQTT-Compatible Telemetry Simulator', description: 'Observable telemetry generation.', pillar: 'telemetry' },
  { id: 'SIM-004', name: 'Trust Score Simulator',              description: 'Deterministic seven-factor trust assessment.', pillar: 'mission_readiness' },
  { id: 'SIM-005', name: 'Cyber Attack Simulator',             description: 'Safe synthetic attack injection.', pillar: 'cybersecurity' },
  { id: 'SIM-006', name: 'Detection Rule Simulator',           description: 'Rules and hard-fail gates.', pillar: 'cybersecurity' },
  { id: 'SIM-007', name: 'Battery Digital Twin Simulator',     description: 'Source-linked run snapshot.', pillar: 'mission_readiness' },
  { id: 'SIM-008', name: 'Battery Health / SOH-SOC Simulator', description: 'Health and degradation scenario.', pillar: 'battery_intelligence' },
  { id: 'SIM-009', name: 'Audit & Evidence Simulator',         description: 'Evidence package draft.', pillar: 'mission_readiness' },
  { id: 'SIM-010', name: 'Integration Test Harness',           description: 'Pipeline orchestrator.', pillar: 'mission_readiness', isOrchestrator: true },
]

export function getSimulator(id: SimulatorDescriptor['id']): SimulatorDescriptor | undefined {
  return SIMULATOR_CATALOG.find(s => s.id === id)
}
