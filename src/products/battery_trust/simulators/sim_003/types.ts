// Mirrors services/sim-003-mqtt/src/sim_003/models/* — keep in sync manually
// until a generated-client step is introduced (see known-limitations report).

export type Sim003Scenario =
  | 'normal' | 'delayed_telemetry' | 'duplicate_packet' | 'out_of_range'
  | 'missing_timestamp' | 'spoofed_identity' | 'replay_attack'

export type Sim003Anomaly =
  | 'NONE' | 'DELAYED_TELEMETRY' | 'DUPLICATE' | 'OUT_OF_RANGE'
  | 'MISSING_TIMESTAMP' | 'SPOOFED_IDENTITY' | 'REPLAY_DETECTED'

export type Sim003RunStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'DEGRADED' | 'STOPPED'

export interface Sim003TelemetryEvent {
  schema_version: string
  event_id: string
  run_id: string
  registered_battery_id: string
  battery_id: string
  sequence_number: number
  timestamp: string | null
  sent_at: string
  voltage_v: number
  current_a: number
  temperature_c: number
  soc_percent: number
  simulated: true
  scenario: Sim003Scenario
  simulation_label: 'EDUCATIONAL_SIMULATION_ONLY'
  replay_of_event_id: string | null
}

export interface Sim003FieldFinding {
  field: string
  value: number
  threshold: number
  operator: string
  unit: string
}

export interface Sim003DetectionResult {
  event_id: string
  anomalies: Sim003Anomaly[]
  primary_anomaly: Sim003Anomaly
  anomaly_detail: string | null
  field_findings: Sim003FieldFinding[]
  schema_valid: boolean
}

export interface Sim003PublishReceipt {
  status: 'ACKNOWLEDGED' | 'FAILED' | 'SKIPPED'
  message_id: number | null
  published_at: string | null
  latency_ms: number | null
}

export interface Sim003Observation {
  received_at: string
  schema_valid: boolean
  anomalies: Sim003Anomaly[]
  primary_anomaly: Sim003Anomaly
  anomaly_detail: string | null
}

export interface Sim003ObservedEvent {
  topic: string
  qos: number
  retain: false
  payload: Sim003TelemetryEvent
  publish: Sim003PublishReceipt
  observation: Sim003Observation
  detection: Sim003DetectionResult
}

export interface Sim003RunResult {
  contract_version: string
  simulator_id: 'SIM-003'
  run_id: string
  scenario: Sim003Scenario
  status: Sim003RunStatus
  transport: 'mqtt' | 'in_memory'
  broker_connected: boolean
  started_at: string | null
  completed_at: string | null
  generated_count: number
  published_count: number
  observed_count: number
  valid_count: number
  invalid_schema_count: number
  anomaly_counts: Record<string, number>
  events: Sim003ObservedEvent[]
  simulated: true
  seed: number
}

export interface Sim003GenerateEventsRequest {
  battery_id: string
  scenario: Sim003Scenario
  num_events?: number
  delay_seconds?: number | null
  replay_window_seconds?: number
  interval_ms?: number
  qos?: 0 | 1 | 2
  publish?: boolean
  transport?: 'mqtt' | 'in_memory'
  profile_id?: string
  seed?: number
}

export interface Sim003HealthResponse {
  status: string
  simulator_id: string
  transport_mode: 'mqtt' | 'in_memory'
  broker_connected: boolean
  poc_local_only: boolean
  classification: string
}

export interface Sim003ScenarioDescriptor {
  id: Sim003Scenario
  description: string
  expected_educational_outcome: string
}
